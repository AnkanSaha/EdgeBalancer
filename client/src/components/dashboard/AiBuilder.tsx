'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/shared/Icons';
import { RainLayer } from '@/components/shared/RainLayer';
import type { AiEvent, AiOutcome, AiStep, LoadBalancer, PendingAction } from '@/types/api';

const MAX_PROMPT_LENGTH = 2000;
const MAX_PROMPT_HEIGHT = 220;

const TOOL_LABELS: Record<string, string> = {
  list_zones: 'Reading your Cloudflare zones',
  list_load_balancers: 'Reading your load balancers',
  create_load_balancer: 'Deploying the load balancer',
  update_load_balancer: 'Preparing the configuration change',
  delete_load_balancer: 'Preparing the deletion',
  pause_load_balancer: 'Preparing the pause',
  resume_load_balancer: 'Preparing the resume',
};

const ACTION_VERBS: Record<PendingAction['action'], string> = {
  delete: 'Delete it',
  pause: 'Pause it',
  resume: 'Resume it',
  update: 'Apply it',
};

const labelFor = (tool: string) => TOOL_LABELS[tool] ?? tool.replace(/_/g, ' ');

export interface AiRunState {
  phase: 'running' | 'done';
  runId: string | null;
  progress: number;
  statusMessage: string;
  steps: AiStep[];
  modelNote: string | null;
  pendingAction: PendingAction | null;
  outcome: AiOutcome | null;
  message: string;
  loadBalancers: LoadBalancer[];
}

export const initialAiRunState: AiRunState = {
  phase: 'running',
  runId: null,
  progress: 4,
  statusMessage: 'Connecting to the provisioning agent',
  steps: [],
  modelNote: null,
  pendingAction: null,
  outcome: null,
  message: '',
  loadBalancers: [],
};

/** Single place mapping the server's SSE contract onto what the overlay renders. */
export function applyAiEvent(state: AiRunState, event: AiEvent): AiRunState {
  switch (event.name) {
    case 'run_start':
      return { ...state, runId: event.payload.runId };

    case 'model_switch':
      return { ...state, modelNote: `Falling back to ${event.payload.to}` };

    case 'status':
      return { ...state, statusMessage: event.payload.message, progress: event.payload.progress };

    case 'tool_start':
      return {
        ...state,
        statusMessage: labelFor(event.payload.name),
        steps: [...state.steps, { label: labelFor(event.payload.name), state: 'running' }],
      };

    case 'tool_result':
      return { ...state, steps: closeLastStep(state.steps, event.payload.ok, event.payload.summary) };

    case 'done':
      return {
        ...state,
        phase: 'done',
        progress: 100,
        outcome: event.payload.outcome,
        message: event.payload.message,
        loadBalancers: event.payload.loadBalancers ?? [],
        pendingAction: event.payload.pendingAction ?? null,
      };

    case 'error':
      return {
        ...state,
        phase: 'done',
        outcome: 'failure',
        message: event.payload.message,
        steps: closeLastStep(state.steps, false, event.payload.message),
      };

    default:
      return state;
  }
}

/** Reveals text one character at a time; jumps to the end if the text changes mid-run. */
function useTypewriter(text: string, charsPerTick = 2, tickMs = 16): string {
  const [shown, setShown] = useState('');

  useEffect(() => {
    if (!text) {
      setShown('');
      return;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(index + charsPerTick, text.length);
      setShown(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, tickMs);

    return () => window.clearInterval(timer);
  }, [text, charsPerTick, tickMs]);

  return shown;
}

function closeLastStep(steps: AiStep[], ok: boolean, detail: string): AiStep[] {
  const lastRunning = steps.map((s) => s.state).lastIndexOf('running');
  if (lastRunning === -1) return steps;
  const next = [...steps];
  next[lastRunning] = { ...next[lastRunning], state: ok ? 'ok' : 'failed', detail };
  return next;
}

// --- Prompt card ---

interface AiPromptCardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function AiPromptCard({ value, onChange, onSubmit, disabled }: AiPromptCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, MAX_PROMPT_HEIGHT);
    el.style.height = `${next}px`;
    // Only scroll once the box has stopped growing, otherwise the bar shows on an empty prompt.
    el.style.overflowY = el.scrollHeight > MAX_PROMPT_HEIGHT ? 'auto' : 'hidden';
  }, [value]);

  const canSubmit = !disabled && value.trim().length > 0;

  return (
    <div
      className="feature-card animate-slide-up"
      style={{
        padding: 'clamp(16px, 2.5vw, 24px)',
        marginBottom: 'clamp(16px, 3vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(10px, 2vw, 14px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Icons.Zap size={15} style={{ color: 'var(--accent)' }} />
        <span className="kicker" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>Describe it, we deploy it</span>
      </div>

      <textarea
        ref={textareaRef}
        className="textarea"
        rows={3}
        maxLength={MAX_PROMPT_LENGTH}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Round-robin balancer named api-edge on example.com routing to https://a.example.com and https://b.example.com…"
        style={{
          width: '100%',
          resize: 'none',
          minHeight: 84,
          lineHeight: 1.6,
          fontSize: 'clamp(13px, 2vw, 14px)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="hide-sm" style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Create, update, pause or delete — destructive steps ask first.
        </span>
        <div style={{ flex: 1, minWidth: 0 }} />
        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {value.length}/{MAX_PROMPT_LENGTH}
        </span>
        <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={!canSubmit}
          style={{ flex: '1 1 auto', justifyContent: 'center' }}>
          <Icons.Zap size={14} />
          <span className="hide-sm">Execute it</span>
          <span className="show-sm">Execute</span>
        </button>
      </div>
    </div>
  );
}

// --- Full-screen progress overlay ---

interface AiProgressOverlayProps {
  isOpen: boolean;
  run: AiRunState;
  actionPending: boolean;
  onConfirmAction: () => void;
  onCancel: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function AiProgressOverlay({
  isOpen,
  run,
  actionPending,
  onConfirmAction,
  onCancel,
  onClose,
  onRetry,
}: AiProgressOverlayProps) {
  const succeeded = run.outcome === 'success';
  const finished = run.phase === 'done';
  // Hooks must run unconditionally, so the early return comes after them.
  const typed = useTypewriter(finished ? run.message : '');
  const tone = finished ? OUTCOME_COPY[run.outcome ?? 'failure'].accent : 'var(--accent)';

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--bg)', overflowY: 'auto', overflowX: 'hidden' }}>

      <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: '-96px', top: '64px', width: 288, height: 288, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: '33%', width: 384, height: 384, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blue) 0%, transparent 70%)', filter: 'blur(80px)',
        }} />
      </div>

      <div style={{
        position: 'relative', zIndex: 2, display: 'flex', minHeight: '100vh',
        alignItems: 'center', justifyContent: 'center', padding: 'clamp(20px, 5vw, 48px)',
      }}>
        <div style={{ width: '100%', maxWidth: 900 }}>
          <Header run={run} finished={finished} />

          {!finished && (
            <>
              <div style={{
                height: 12, background: 'var(--bg-2)', borderRadius: 999,
                overflow: 'hidden', marginBottom: 16, border: '1px solid var(--line)',
              }}>
                <div style={{
                  height: '100%', width: `${run.progress}%`, borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)',
                  transition: 'width 700ms ease',
                }} />
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
                marginBottom: 24, fontSize: 13, color: 'var(--text-2)',
              }}>
                <span>{run.statusMessage}</span>
                <span className="mono" style={{ color: 'var(--accent)' }}>{run.progress}%</span>
              </div>
            </>
          )}

          {!finished && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            </div>
          )}

          {run.modelNote && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>
              {run.modelNote}
            </div>
          )}

          <StepList steps={run.steps} running={!finished && run.phase === 'running'} />

          {finished && (
            <Result
              run={run}
              succeeded={succeeded}
              typed={typed}
              actionPending={actionPending}
              onConfirmAction={onConfirmAction}
              onClose={onClose}
              onRetry={onRetry}
            />
          )}
        </div>
      </div>

      <RainLayer tone={tone} />
    </div>
  );
}

/**
 * The four terminal outcomes need different framing: a missing-detail question must not read
 * like a crash, and a root-cause analysis must not read like a warning banner.
 */
const OUTCOME_COPY: Record<AiOutcome, { title: string; kicker: string; accent: string }> = {
  success: { title: 'Deployed', kicker: '// Congratulations', accent: 'var(--green)' },
  refused: { title: 'More detail needed', kicker: '// Missing information', accent: 'var(--accent)' },
  pending: { title: 'Ready when you are', kicker: '// Confirm to apply', accent: 'var(--accent)' },
  failure: { title: 'Could not finish', kicker: '// Root cause', accent: 'var(--red)' },
};

function Header({ run, finished }: { run: AiRunState; finished: boolean }) {
  const copy = OUTCOME_COPY[run.outcome ?? 'failure'];

  const title = !finished
    ? 'Building with AI'
    : copy.title;

  // The finished message is typed out below rather than shown statically here.
  const description = finished
    ? ''
    : 'The agent is reading your Cloudflare account and provisioning the Worker. Keep this tab open.';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'clamp(12px, 3vw, 24px)', marginBottom: finished ? 20 : 32 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="kicker" style={{ marginBottom: 12, color: finished ? copy.accent : 'var(--accent)' }}>
          {finished ? copy.kicker : '// AI Provisioning'}
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 500, margin: 0, letterSpacing: '-0.02em', color: 'var(--text)' }}>
          {title}
        </h2>
        <p style={{ marginTop: 12, maxWidth: 640, fontSize: 14, lineHeight: 1.6, color: 'var(--text-2)' }}>
          {description}
        </p>
      </div>

      {!finished && (
        <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }} className="hide-sm">
          <div style={{ position: 'absolute', inset: 0, border: '1px solid var(--line)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 12, border: '1px solid var(--line-2)', borderRadius: '50%' }} />
          <div style={{
            position: 'absolute', inset: 24, borderRadius: '50%',
            border: '4px solid var(--line)', borderTopColor: 'var(--accent)',
            animation: 'spin 1.2s linear infinite',
          }} />
          <div style={{ position: 'absolute', inset: 38, background: 'var(--accent-dim)', borderRadius: '50%' }} />
        </div>
      )}
    </div>
  );
}

function StepList({ steps, running }: { steps: AiStep[]; running: boolean }) {
  if (steps.length === 0) {
    return running ? (
      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 8px' }}>
        Interpreting your request…
      </p>
    ) : null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
      {steps.map((step, index) => {
        const color = step.state === 'ok' ? 'var(--green)' : step.state === 'failed' ? 'var(--red)' : 'var(--accent)';
        return (
          <div
            key={`${step.label}-${index}`}
            className="ai-step"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 14px', borderRadius: 'var(--radius-lg)',
              border: `1px solid ${step.state === 'running' ? 'var(--accent)' : 'var(--line)'}`,
              background: step.state === 'running' ? 'var(--accent-dim)' : 'var(--bg-2)',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text)' }}>{step.label}</div>
              {step.detail && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, wordBreak: 'break-word' }}>
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Result({
  run,
  succeeded,
  typed,
  actionPending,
  onConfirmAction,
  onClose,
  onRetry,
}: {
  run: AiRunState;
  succeeded: boolean;
  typed: string;
  actionPending: boolean;
  onConfirmAction: () => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  const copy = OUTCOME_COPY[run.outcome ?? 'failure'];
  // Anything that isn't a clean success is worth another edit of the prompt.
  const canRetry = run.outcome === 'failure' || run.outcome === 'refused';
  const stillTyping = typed.length < run.message.length;
  const pending = run.pendingAction;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        padding: 'clamp(14px, 3vw, 18px)', marginBottom: 20,
        borderRadius: 'var(--radius-lg)', border: `1px solid ${copy.accent}`,
        background: 'var(--bg-2)',
      }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
          {typed}
          {stillTyping && (
            <span style={{
              display: 'inline-block', width: 7, height: 15, marginLeft: 2,
              background: copy.accent, verticalAlign: 'text-bottom',
              animation: 'pulse 1s steps(2) infinite',
            }} />
          )}
        </p>
      </div>

      {pending && (
        <div style={{
          padding: 'clamp(14px, 3vw, 18px)', marginBottom: 20,
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent)',
          background: 'var(--accent-dim)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icons.Shield size={15} style={{ color: 'var(--accent)' }} />
            <span className="kicker" style={{ fontSize: 11 }}>Nothing has changed yet</span>
          </div>

          <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text)' }}>{pending.summary}</p>
          <p className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>{pending.fullDomain}</p>

          <div className="ai-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={actionPending}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={onConfirmAction} disabled={actionPending}>
              {actionPending ? 'Working…' : ACTION_VERBS[pending.action]}
            </button>
          </div>
        </div>
      )}

      {run.loadBalancers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {run.loadBalancers.map((lb) => (
            <div key={lb.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              padding: '12px 14px', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--line)', background: 'var(--bg-2)',
            }}>
              <Icons.Check size={14} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{lb.name}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>{lb.fullDomain}</span>
            </div>
          ))}
        </div>
      )}

      {/* The pending panel carries its own buttons — a second pair would compete with it. */}
      {!pending && (
        <div className="ai-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${canRetry ? 'btn-ghost' : 'btn-primary'}`} onClick={onClose}>
            Back to dashboard
          </button>
          {canRetry && (
            <button className="btn btn-primary btn-sm" onClick={onRetry}>Edit prompt</button>
          )}
        </div>
      )}
    </div>
  );
}
