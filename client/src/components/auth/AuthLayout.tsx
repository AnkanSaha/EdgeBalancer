'use client';

import { Icons } from '@/components/shared/Icons';

interface AuthStep {
  n: string;
  t: string;
  d: string;
}

interface AuthLayoutProps {
  children: React.ReactNode;
  step: 'signin' | 'register' | 'connect' | 'verified';
  onBack: () => void;
  /** Replaces the three-step rail in the brand panel. Re-rendered below the
   *  form under 768px, where that panel is hidden. */
  aside?: React.ReactNode;
}

export const AuthLayout = ({ children, step, onBack, aside }: AuthLayoutProps) => {
  const steps: AuthStep[] = [
    { n: '01', t: 'Create your account', d: 'One tap with Google. No credit card.' },
    { n: '02', t: 'Connect Cloudflare', d: 'Paste a scoped API token — Workers + DNS edit access.' },
    { n: '03', t: 'Deploy your first balancer', d: 'Pick zone, add origins, choose strategy. 90 seconds.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-grid">

      {/* Left — brand panel */}
      <div style={{
        position: 'relative', background: 'var(--bg-1)',
        borderRight: '1px solid var(--line)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', padding: 'clamp(24px, 5vw, 48px)',
      }} className="hide-md">
        <div className="grid-bg" style={{ opacity: 0.2 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 12px)' }}>
            ← edge/balancer
          </button>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          position: 'relative', zIndex: 2, overflowY: 'auto', padding: '24px 0',
        }}>
          {aside ?? (
            <>
          <div className="kicker" style={{ marginBottom: 20 }}>// three steps</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 420 }}>
            {steps.map((s, i) => {
              const active = (step === 'register' && i === 0) || (step === 'connect' && i === 1) || (step === 'verified' && i === 2);
              const done = (step === 'connect' && i < 1) || (step === 'verified' && i < 2);
              return (
                <div key={i} style={{
                  display: 'flex', gap: 16, padding: 16,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  transition: 'all 200ms',
                }}>
                  <div style={{
                    fontFamily: 'var(--mono)', fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-3)',
                    minWidth: 24,
                  }}>
                    {done ? <Icons.Check size={14} stroke="var(--green)" /> : s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.t}</div>
                    <div style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: 'var(--text-3)', marginTop: 4 }}>{s.d}</div>
                  </div>
                </div>
              );
            })}
          </div>
            </>
          )}
        </div>

        <div style={{
          position: 'relative', zIndex: 2,
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          &quot;Our p95 dropped 62% in a weekend.&quot; — platform eng, fintech
        </div>
      </div>

      {/* Right — forms */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(20px, 5vw, 48px)', position: 'relative',
        minHeight: '100vh',
      }}>
        <button onClick={onBack} className="hide-md-inverse" style={{
          position: 'absolute', top: 'clamp(16px, 4vw, 24px)', left: 'clamp(16px, 4vw, 24px)',
          color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12,
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 10,
        }}>
          ← back
        </button>

        <div style={{ width: '100%', maxWidth: 400 }} className="slide-in">
          {children}
          {aside && (
            <div className="hide-md-inverse" style={{ marginTop: 28 }}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const GoogleG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const GithubMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" fillOpacity="0.9">
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-.99-.02-1.95-3.2.7-3.88-1.42-3.88-1.42-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.49-.28-5.11-1.25-5.11-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.09 1.15a10.7 10.7 0 0 1 5.63 0c2.14-1.45 3.08-1.15 3.08-1.15.62 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.32-2.63 5.27-5.13 5.55.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>
  </svg>
);

export const Divider = ({ label }: { label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    margin: '8px 0 20px',
    fontFamily: 'var(--mono)', fontSize: 11,
    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
  }}>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
    <span>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);
