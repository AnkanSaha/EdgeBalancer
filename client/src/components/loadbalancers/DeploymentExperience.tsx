'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/shared/Icons';

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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 90,
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <div style={{
          position: 'absolute', left: '-96px', top: '64px',
          width: '288px', height: '288px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: '33%',
          width: '384px', height: '384px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blue) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '33%',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--green) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{
        position: 'relative',
        display: 'flex', minHeight: '100vh',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%', maxWidth: '900px',
          background: 'var(--bg-1)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.6)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 24, marginBottom: 40,
          }}>
            <div style={{ flex: 1 }}>
              <div className="kicker" style={{ marginBottom: 12, color: 'var(--accent)' }}>
                // {statusLabel}
              </div>
              <h2 style={{
                fontSize: 36, fontWeight: 500, margin: 0,
                letterSpacing: '-0.02em', color: 'var(--text)',
              }}>
                {targetName || 'edge-deployment'}
              </h2>
              <p style={{
                marginTop: 12, maxWidth: 640, fontSize: 14,
                lineHeight: 1.6, color: 'var(--text-2)',
              }}>
                {statusDescription}
              </p>
            </div>

            <div style={{ position: 'relative', width: 112, height: 112, flexShrink: 0 }} className="hide-sm">
              <div style={{
                position: 'absolute', inset: 0,
                border: '1px solid var(--line)', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', inset: 12,
                border: '1px solid var(--line-2)', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', inset: 24,
                border: '4px solid var(--line)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1.2s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 38,
                background: 'var(--accent-dim)', borderRadius: '50%',
              }} />
            </div>
          </div>

          <div style={{
            height: 12, background: 'var(--bg-2)',
            borderRadius: 999, overflow: 'hidden', marginBottom: 24,
            border: '1px solid var(--line)',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 100%)',
              borderRadius: 999,
              width: `${step.progress}%`,
              transition: 'width 700ms ease',
            }} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32, fontSize: 13, color: 'var(--text-2)',
          }}>
            <span>{cancelRequested ? 'Rollback and cleanup in progress' : step.label}</span>
            <span className="mono" style={{ color: 'var(--accent)' }}>
              {cancelRequested ? '...' : `${step.progress}%`}
            </span>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}>
            {PROGRESS_STEPS[mode].map((item, index) => {
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;

              return (
                <div
                  key={item.label}
                  style={{
                    padding: 16, borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${isActive ? 'var(--accent)' : isCompleted ? 'var(--green)' : 'var(--line)'}`,
                    background: isActive ? 'var(--accent-dim)' : isCompleted ? 'oklch(0.78 0.14 150 / 0.08)' : 'var(--bg-2)',
                    transition: 'all 300ms',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: isCompleted ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--line-2)',
                    }} />
                    <span className="kicker" style={{ fontSize: 10 }}>
                      Phase {index + 1}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 13, lineHeight: 1.5, margin: 0,
                    color: isActive ? 'var(--text)' : isCompleted ? 'var(--text-2)' : 'var(--text-3)',
                  }}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          {cancellable && (
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-ghost"
                onClick={onCancel}
                disabled={cancelRequested}
              >
                {cancelRequested ? 'Canceling...' : 'Cancel Deployment'}
              </button>
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95,
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
        <div style={{
          position: 'absolute', left: '40px', top: '64px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--green) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', right: '24px', top: '80px',
          width: '256px', height: '256px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '384px', height: '384px', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--blue) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
      </div>

      <div style={{
        position: 'relative',
        display: 'flex', minHeight: '100vh',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: '100%', maxWidth: '640px',
          background: 'var(--bg-1)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px', textAlign: 'center',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.6)',
        }}>
          <div style={{
            position: 'relative', margin: '0 auto 32px',
            width: 144, height: 144,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '1px solid var(--green)',
              borderRadius: '50%', opacity: 0.3,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 16,
              border: '1px solid var(--accent)',
              borderRadius: '50%', opacity: 0.3,
            }} />
            <div style={{
              position: 'absolute', inset: 32,
              background: 'radial-gradient(circle, var(--green) 0%, var(--accent) 100%)',
              borderRadius: '50%', opacity: 0.15, filter: 'blur(20px)',
            }} />
            <div style={{
              position: 'relative',
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'oklch(0.78 0.14 150 / 0.15)',
              borderRadius: '50%',
              border: '1px solid var(--green)',
              color: 'var(--green)',
            }}>
              <Icons.Check size={40} strokeWidth={2.5} />
            </div>
          </div>

          <div className="kicker" style={{ marginBottom: 12, color: 'var(--green)' }}>
            // {mode === 'create' ? 'Deployment Complete' : mode === 'edit' ? 'Update Complete' : 'Deletion Complete'}
          </div>
          <h2 style={{
            fontSize: 32, fontWeight: 500, margin: 0,
            letterSpacing: '-0.02em', color: 'var(--text)',
          }}>
            {mode === 'delete' ? 'Load balancer deleted' : 'Your load balancer is active'}
          </h2>
          <p style={{
            margin: '16px auto 0', maxWidth: 560, fontSize: 14,
            lineHeight: 1.7, color: 'var(--text-2)',
          }}>
            {mode === 'delete' ? (
              <>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{name}</span> at{' '}
                <span className="mono" style={{ color: 'var(--accent)' }}>{fullDomain}</span> has been removed from Cloudflare and deleted from your dashboard.
              </>
            ) : (
              <>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{name}</span> is now live at{' '}
                <span className="mono" style={{ color: 'var(--accent)' }}>{fullDomain}</span>. The edge route has been activated with the latest configuration.
              </>
            )}
          </p>

          <div style={{
            marginTop: 32, padding: 20,
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-2)', textAlign: 'left',
          }}>
            <div className="kicker" style={{ marginBottom: 8 }}>
              {mode === 'delete' ? 'Removed Endpoint' : 'Active Endpoint'}
            </div>
            <div className="mono" style={{ fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>
              {fullDomain}
            </div>
            <div className="kicker" style={{ marginBottom: 8 }}>Worker Name</div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--green)' }}>{name}</div>
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={onContinue} style={{ minWidth: 200 }}>
              <Icons.Arrow size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
