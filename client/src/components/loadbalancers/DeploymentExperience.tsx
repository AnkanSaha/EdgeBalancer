'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface DeploymentOverlayProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  targetName: string;
  onCancel: () => void;
  cancelRequested: boolean;
  cancellable?: boolean;
}

interface DeploymentSuccessModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'delete';
  name: string;
  fullDomain: string;
  onContinue: () => void;
}

const PROGRESS_STEPS = {
  create: [
    { label: 'Validating edge configuration', progress: 22 },
    { label: 'Publishing Worker runtime', progress: 48 },
    { label: 'Attaching Cloudflare domain', progress: 74 },
    { label: 'Finalizing deployment state', progress: 92 },
  ],
  edit: [
    { label: 'Uploading a candidate Worker version', progress: 24 },
    { label: 'Promoting the new active deployment', progress: 52 },
    { label: 'Synchronizing custom domain attachments', progress: 78 },
    { label: 'Verifying rollback checkpoints', progress: 93 },
  ],
  delete: [
    { label: 'Detaching custom domain from the Worker', progress: 25 },
    { label: 'Removing active Worker script', progress: 58 },
    { label: 'Cleaning stored load balancer state', progress: 82 },
    { label: 'Finalizing edge teardown', progress: 96 },
  ],
};

export function DeploymentOverlay({
  isOpen,
  mode,
  targetName,
  onCancel,
  cancelRequested,
  cancellable = true,
}: DeploymentOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % PROGRESS_STEPS[mode].length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const step = PROGRESS_STEPS[mode][stepIndex];
  const statusLabel = cancelRequested
    ? 'Cancellation requested'
    : mode === 'create'
      ? 'Creating Load Balancer'
      : mode === 'edit'
        ? 'Updating Load Balancer'
        : 'Deleting Load Balancer';
  const statusDescription = cancelRequested
    ? 'The request has been aborted on the client. The server is rolling back any in-flight Cloudflare changes before it releases the operation.'
    : mode === 'create'
      ? 'We are provisioning your Worker, binding the selected domain, and warming up the new edge route.'
      : mode === 'edit'
        ? 'We are preparing a new Worker version, promoting it through Cloudflare deployment controls, and updating domain attachments only when needed.'
        : 'We are detaching the active hostname, removing the Worker script, and cleaning up the stored load balancer state.';

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)]">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.7)] backdrop-blur-xl md:p-12">
          <div className="mb-10 flex items-center justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">
                {statusLabel}
              </p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                {targetName || 'edge-deployment'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                {statusDescription}
              </p>
            </div>

            <div className="relative hidden h-28 w-28 shrink-0 md:block">
              <div className="absolute inset-0 rounded-full border border-cyan-300/20" />
              <div className="absolute inset-3 rounded-full border border-cyan-300/35" />
              <div className="absolute inset-6 animate-spin rounded-full border-4 border-cyan-300/20 border-t-cyan-300" />
              <div className="absolute inset-[2.35rem] rounded-full bg-cyan-300/15" />
            </div>
          </div>

          <div className="mb-6 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-300 transition-all duration-700"
              style={{ width: `${step.progress}%` }}
            />
          </div>

          <div className="mb-8 flex items-center justify-between text-sm text-slate-300">
            <span>{cancelRequested ? 'Rollback and cleanup in progress' : step.label}</span>
            <span>{cancelRequested ? '...' : `${step.progress}%`}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {PROGRESS_STEPS[mode].map((item, index) => {
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;

              return (
                <div
                  key={item.label}
                  className={`rounded-2xl border px-4 py-4 transition-all ${
                    isActive
                      ? 'border-cyan-300/50 bg-cyan-300/10 text-white'
                      : isCompleted
                        ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
                        : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        isCompleted ? 'bg-emerald-300' : isActive ? 'bg-cyan-300' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-xs uppercase tracking-[0.25em]">
                      Phase {index + 1}
                    </span>
                  </div>
                  <p className="text-sm leading-6">{item.label}</p>
                </div>
              );
            })}
          </div>

          {cancellable && (
            <div className="mt-8 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={cancelRequested}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                {cancelRequested ? 'Canceling...' : 'Cancel Deployment'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeploymentSuccessModal({
  isOpen,
  mode,
  name,
  fullDomain,
  onContinue,
}: DeploymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden bg-[radial-gradient(circle_at_top,#34d399_0%,#0f172a_42%,#020617_100%)]">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-10 top-16 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-6 top-20 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lime-300/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/15 bg-slate-950/75 p-8 text-center shadow-[0_40px_120px_rgba(4,120,87,0.45)] backdrop-blur-xl md:p-12">
          <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full border border-emerald-300/30" />
            <div className="absolute inset-4 rounded-full border border-cyan-300/30" />
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-300/30 to-cyan-300/30 blur-md" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-300/20 text-white shadow-[0_0_40px_rgba(52,211,153,0.35)]">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/80">
            {mode === 'create' ? 'Deployment Complete' : mode === 'edit' ? 'Update Complete' : 'Deletion Complete'}
          </p>
          <h2 className="text-4xl font-semibold text-white">
            {mode === 'delete' ? 'Load balancer deleted' : 'Your load balancer is active'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            {mode === 'delete' ? (
              <>
                <span className="font-semibold text-white">{name}</span> at{' '}
                <span className="font-semibold text-cyan-300">{fullDomain}</span> has been removed from Cloudflare and deleted from your dashboard.
              </>
            ) : (
              <>
                <span className="font-semibold text-white">{name}</span> is now live at{' '}
                <span className="font-semibold text-cyan-300">{fullDomain}</span>. The edge route has been activated with the latest configuration.
              </>
            )}
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-left">
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              {mode === 'delete' ? 'Removed Endpoint' : 'Active Endpoint'}
            </div>
            <div className="font-mono text-lg text-white">{fullDomain}</div>
            <div className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">Worker Name</div>
            <div className="font-mono text-sm text-emerald-200">{name}</div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button onClick={onContinue} size="lg" className="min-w-52 bg-white text-slate-950 hover:bg-emerald-100">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
