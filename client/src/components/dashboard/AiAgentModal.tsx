'use client';

import { useEffect, useRef, useState } from 'react';
import { Icons } from '@/components/shared/Icons';
import type { AiEvent, AiOutcome, AiStep, ConversationTurn, LoadBalancer } from '@/types/api';
import Link from 'next/link';

const MAX_PROMPT_LENGTH = 2000;
const MAX_PROMPT_HEIGHT = 220;

const TOOL_LABELS: Record<string, string> = {
  find_tools: 'Loading capabilities',
  ask_user: 'Asking you a question',
  list_zones: 'Reading your Cloudflare zones',
  list_load_balancers: 'Reading your load balancers',
  create_load_balancer: 'Deploying the load balancer',
  update_load_balancer: 'Applying the configuration change',
  delete_load_balancer: 'Deleting the load balancer',
  pause_load_balancer: 'Pausing the load balancer',
  resume_load_balancer: 'Resuming the load balancer',
  web_search: 'Researching an error',
  fetch_url: 'Reading a reference page',
};

const labelFor = (tool: string) => TOOL_LABELS[tool] ?? tool.replace(/_/g, ' ');

export interface AiRunState {
  phase: 'running' | 'done';
  runId: string | null;
  progress: number;
  statusMessage: string;
  steps: AiStep[];
  /** Model currently answering — shown top-left of the modal. */
  activeModel: string | null;
  modelNote: string | null;
  outcome: AiOutcome | null;
  message: string;
  loadBalancers: LoadBalancer[];
}

export const initialAiRunState: AiRunState = {
  phase: 'running',
  runId: null,
  progress: 4,
  statusMessage: 'Connecting to the AI Agent',
  steps: [],
  activeModel: null,
  modelNote: null,
  outcome: null,
  message: '',
  loadBalancers: [],
};

/** Single place mapping the server's SSE contract onto what the modal renders. */
export function applyAiEvent(state: AiRunState, event: AiEvent): AiRunState {
  switch (event.name) {
    case 'run_start':
      return { ...state, runId: event.payload.runId };

    case 'model_active':
      return { ...state, activeModel: event.payload.model };

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
  isPro?: boolean;
}

export function AiPromptCard({ value, onChange, onSubmit, disabled, isPro }: AiPromptCardProps) {
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

  if (!isPro) {
    return (
      <div className="feature-card" style={{
        padding: 'clamp(16px, 2.5vw, 24px)',
        marginBottom: 'clamp(16px, 3vw, 24px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Lock size={15} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>The AI Agent is a Pro feature</span>
        </div>
        <Link href="/pro">
          <button className="btn btn-primary btn-sm">Upgrade to Pro</button>
        </Link>
      </div>
    );
  }

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
        placeholder="Create a round-robin load balancer named api-edge on mysite.com with origins https://a.mysite.com and https://b.mysite.com, enable CORS for https://app.mysite.com, rate limit 100 req/min globally and 10 req/min on /login/*, path route /api/* to origin 2, enable health checks every 30s, and use smart placement…"
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
          Create deploys instantly · destructive steps are confirmed with you first.
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

// --- Agent modal ---

interface AiAgentModalProps {
  isOpen: boolean;
  run: AiRunState;
  /** Full conversation so far — every clarification round-trip stays visible. */
  messages: ConversationTurn[];
  onCancel: () => void;
  onClose: () => void;
  onReply: (text: string) => void;
}

/**
 * Bold headline states, one per phase — the middle-top slot of the modal.
 */
const STATUS_COPY: Record<string, { label: string; color: string }> = {
  running: { label: 'Working…', color: 'var(--accent)' },
  success: { label: 'Completed', color: 'var(--green)' },
  needs_input: { label: 'Waiting for your reply', color: 'var(--accent)' },
  refused: { label: 'Out of scope', color: 'var(--text-2)' },
  failure: { label: 'Failed', color: 'var(--red)' },
};

export function AiAgentModal({ isOpen, run, messages, onCancel, onClose, onReply }: AiAgentModalProps) {
  const finished = run.phase === 'done';
  const succeeded = run.outcome === 'success';
  const needsInput = finished && run.outcome === 'needs_input';

  // Hooks must run unconditionally, so the early return comes after them.
  const typed = useTypewriter(finished ? run.message : '');
  const stillTyping = typed.length < run.message.length;
  const [reply, setReply] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!needsInput) setReply('');
  }, [needsInput]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [run.steps.length, run.message, messages.length]);

  if (!isOpen) return null;

  const statusKey = !finished ? 'running' : (run.outcome ?? 'failure');
  const status = STATUS_COPY[statusKey] ?? STATUS_COPY.failure;
  const tone = finished ? status.color : 'var(--accent)';
  const canSendReply = reply.trim().length > 0;

  const submitReply = () => {
    if (!canSendReply) return;
    onReply(reply.trim());
    setReply('');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(8, 10, 14, 0.55)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 32px)',
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={{
        width: '100%', maxWidth: 780, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>

        {/* Header — activity top-left, bold status centre-top, cancel/close top-right */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)',
          padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)',
          borderBottom: '1px solid var(--line)', flexWrap: 'wrap',
        }}>
          {/* Top-left: the model and what it is doing right now */}
          <div style={{ minWidth: 180, flex: '1 1 200px' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
              {run.activeModel ?? 'AI Agent'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {run.statusMessage}
            </div>
          </div>

          {/* Centre-top: the bold headline status */}
          <div style={{
            flex: '2 1 220px', textAlign: 'center',
            fontSize: 'clamp(15px, 2.5vw, 19px)', fontWeight: 700, letterSpacing: '-0.01em',
            color: status.color,
          }}>
            {status.label}
          </div>

          {/* Top-right: cancel rolls back the step in flight; close appears once settled */}
          <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'flex-end' }}>
            {!finished ? (
              <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
            )}
          </div>
        </div>

        {/* Progress */}
        {!finished && (
          <div style={{ padding: '0 clamp(16px, 3vw, 24px)', paddingTop: 14 }}>
            <div style={{
              height: 8, background: 'var(--bg-2)', borderRadius: 999,
              overflow: 'hidden', border: '1px solid var(--line)',
            }}>
              <div style={{
                height: '100%', width: `${run.progress}%`, borderRadius: 999,
                background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)',
                transition: 'width 700ms ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
              <span>Keep this tab open — cancelling rolls back the step in flight.</span>
              <span className="mono" style={{ color: 'var(--accent)' }}>{run.progress}%</span>
            </div>
          </div>
        )}

        {run.modelNote && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', padding: '8px clamp(16px, 3vw, 24px) 0' }}>
            {run.modelNote}
          </div>
        )}

        {/* Thread: conversation turns above, live tool steps below */}
        <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 3vw, 24px)' }}>
          {messages.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {messages.map((turn, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '9px 13px', borderRadius: 'var(--radius-lg)',
                    fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                    ...(turn.role === 'user'
                      ? { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--text)' }
                      : { background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text-2)' }),
                  }}
                >
                  {turn.content}
                </div>
              ))}
            </div>
          )}

          <StepList steps={run.steps} running={!finished} />

          {finished && (
            <div style={{
              padding: 'clamp(12px, 2.5vw, 16px)',
              borderRadius: 'var(--radius-lg)', border: `1px solid ${tone}`,
              background: 'var(--bg-2)',
            }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                {typed}
                {stillTyping && (
                  <span style={{
                    display: 'inline-block', width: 7, height: 15, marginLeft: 2,
                    background: tone, verticalAlign: 'text-bottom',
                    animation: 'pulse 1s steps(2) infinite',
                  }} />
                )}
              </p>
            </div>
          )}

          {succeeded && run.loadBalancers.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {run.loadBalancers.map((lb) => (
                <div key={lb.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  padding: '10px 13px', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--line)', background: 'var(--bg-2)',
                }}>
                  <Icons.Check size={14} style={{ color: 'var(--green)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{lb.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>{lb.fullDomain}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply box — appears only when the agent asked for something */}
        {needsInput && (
          <div style={{
            borderTop: '1px solid var(--line)',
            padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
            display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <textarea
              className="textarea"
              rows={1}
              autoFocus
              maxLength={MAX_PROMPT_LENGTH}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
              placeholder="Type your answer… (Enter to send)"
              style={{ flex: 1, resize: 'none', minHeight: 42, fontSize: 13 }}
            />
            <button className="btn btn-primary btn-sm" onClick={submitReply} disabled={!canSendReply}>
              Send
            </button>
          </div>
        )}

        {/* Footer actions once settled */}
        {finished && !needsInput && (
          <div style={{
            borderTop: '1px solid var(--line)',
            padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Back to dashboard</button>
          </div>
        )}
      </div>
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
              padding: '10px 13px', borderRadius: 'var(--radius-lg)',
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
