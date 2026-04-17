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
}

export const AuthLayout = ({ children, step, onBack }: AuthLayoutProps) => {
  const steps: AuthStep[] = [
    { n: '01', t: 'Create your account', d: 'Email + password. No credit card.' },
    { n: '02', t: 'Connect Cloudflare', d: 'Paste a scoped API token — Workers + DNS edit access.' },
    { n: '03', t: 'Deploy your first balancer', d: 'Pick zone, add origins, choose strategy. 90 seconds.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-grid">
      {/* Left — brand panel */}
      <div style={{
        position: 'relative', background: 'var(--bg-1)',
        borderRight: '1px solid var(--line)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', padding: 48,
      }} className="hide-md">
        <div className="grid-bg" style={{ opacity: 0.2 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
            ← edge/balancer
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
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
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.d}</div>
                  </div>
                </div>
              );
            })}
          </div>
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
        padding: 48, position: 'relative',
      }}>
        <button onClick={onBack} className="hide-md-inverse" style={{
          position: 'absolute', top: 24, left: 24,
          color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12,
          display: 'none',
        }}>
          ← back
        </button>

        <div style={{ width: '100%', maxWidth: 400 }} className="slide-in">
          {children}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .auth-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
