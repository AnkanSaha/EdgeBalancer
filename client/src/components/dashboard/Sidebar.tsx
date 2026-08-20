'use client';

import { useState } from 'react';
import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';

interface SidebarProps {
  current: string;
  onNav: (id: string) => void;
  onLogout: () => void;
  userEmail?: string | null;
  hasCloudflareCredentials?: boolean;
  cloudflareOAuthConnected?: boolean;
  isReady?: boolean;
  isPro?: boolean;
  plan?: string;
  planExpiresAt?: string | null;
}

export const Sidebar = ({ current, onNav, onLogout, userEmail, hasCloudflareCredentials, cloudflareOAuthConnected, isReady, isPro, plan, planExpiresAt }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { id: 'balancers', icon: 'Layers', label: 'Load Balancers' },
    { id: 'sessions', icon: 'History', label: 'LB History' },
    { id: 'ai-runs', icon: 'Zap', label: 'AI Runs' },
    { id: 'pro', icon: 'Crown', label: 'EdgeBalancer Pro' },
  ];

  const bottom = [
    { id: 'payments', icon: 'CreditCard', label: 'Payment History' },
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ];

  const SidebarContent = () => (
    <>
      <div style={{ padding: '0 8px 20px' }}>
        <Logo />
        {plan && plan !== 'free' && planExpiresAt && new Date(planExpiresAt) > new Date() && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 'var(--radius)',
            background: plan === 'pro'
              ? 'linear-gradient(135deg, #f59e0b22, #f9731622)'
              : plan === 'student'
              ? 'linear-gradient(135deg, #3b82f622, #6366f122)'
              : 'linear-gradient(135deg, #8b5cf622, #a855f722)',
            border: plan === 'pro'
              ? '1px solid #f59e0b55'
              : plan === 'student'
              ? '1px solid #3b82f655'
              : '1px solid #8b5cf655',
            marginTop: 10,
            boxShadow: plan === 'pro' ? '0 0 20px #f59e0b15' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: plan === 'pro'
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : plan === 'student'
                ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: plan === 'pro' ? '0 2px 8px #f59e0b44' : 'none',
            }}>
              <Icons.Crown size={14} fill="#fff" stroke="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: plan === 'pro' ? '#f59e0b' : plan === 'student' ? '#3b82f6' : '#8b5cf6',
                fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              }}>{plan === 'pro' ? 'Pro User' : plan === 'student' ? 'Student' : 'Trial'}</div>
              <div style={{
                fontSize: 11, color: 'var(--text-3)', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Until {new Date(planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const Ico = Icons[it.icon as keyof typeof Icons];
          const active = current === it.id;
          return (
            <button key={it.id} onClick={() => { onNav(it.id); setMobileOpen(false); }} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius)',
              background: active ? 'var(--accent-dim)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-2)',
              fontSize: 13, textAlign: 'left',
              borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              paddingLeft: 10,
              width: '100%',
              border: 'none',
              cursor: 'pointer',
              fontWeight: active ? 500 : 400,
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <Ico size={15} stroke={active ? 'var(--accent)' : 'currentColor'} />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{
        padding: 14, border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', marginBottom: 12,
        fontSize: 'clamp(11px, 2vw, 12px)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 6, height: 6, flexShrink: 0 }}>
            <div className="animate-ping" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: hasCloudflareCredentials ? 'var(--green)' : 'var(--red)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: hasCloudflareCredentials ? 'var(--green)' : 'var(--red)' }} />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>
            {hasCloudflareCredentials ? 'Cloudflare Connected' : 'Cloudflare Not Connected'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          Auth: {cloudflareOAuthConnected ? 'OAuth' : 'API Token'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          Status: {isReady ? <span style={{ color: 'var(--green)' }}>Ready</span> : <span style={{ color: 'var(--red)' }}>Not Ready</span>}
        </div>
      </div>

      {bottom.map(it => {
        const Ico = Icons[it.icon as keyof typeof Icons];
        return (
          <button key={it.id} onClick={() => { onNav(it.id); setMobileOpen(false); }} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 'var(--radius)',
            color: 'var(--text-2)', fontSize: 13,
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}>
            <Ico size={15} /> {it.label}
          </button>
        );
      })}
      <button onClick={() => { onLogout(); setMobileOpen(false); }} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 'var(--radius)',
        color: 'var(--text-3)', fontSize: 13,
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}>
        <Icons.Logout size={15} /> Log out
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 240, borderRight: '1px solid var(--line)',
        background: 'var(--bg)', flexDirection: 'column',
        padding: '20px 12px', position: 'sticky', top: 0, height: '100vh',
        overflowY: 'auto',
      }} suppressHydrationWarning>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Header with Toggle */}
      <div className="sidebar-mobile-header" style={{
        alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(12px, 2vw, 16px)', borderBottom: '1px solid var(--line)',
        gap: 12, zIndex: 35,
      }}>
        <Logo />
        <button
          className="mobile-menu-trigger"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 'var(--radius)',
            backgroundImage: 'linear-gradient(to right, var(--accent), var(--orange))',
            color: '#fff', boxShadow: '0 4px 24px #f59e0b4d',
            border: 'none', cursor: 'pointer',
          }}
        >
          {mobileOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay & Drawer */}
      <>
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)',
            opacity: mobileOpen ? 1 : 0,
            pointerEvents: mobileOpen ? 'auto' : 'none',
            transition: 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <aside className="sidebar-mobile" style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 41,
          width: 'min(280px, 85vw)',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg)', flexDirection: 'column',
          padding: '20px 12px', overflow: 'auto',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <SidebarContent />
        </aside>
      </>

    </>
  );
};

export const Topbar = ({ title, subtitle, actions, crumbs }: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  crumbs?: string[];
}) => (
  <header style={{
    padding: 'clamp(16px, 3vw, 24px)', borderBottom: '1px solid var(--line)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    gap: 16, flexWrap: 'wrap',
  }}>
    <div style={{ minWidth: 0, flex: 1 }}>
      {crumbs && (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {crumbs.join(' / ')}
        </div>
      )}
      <h1 style={{ 
        fontSize: 'clamp(20px, 4vw, 24px)', margin: 0, letterSpacing: '-0.02em', fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{title}</h1>
      {subtitle && (
        <div style={{ color: 'var(--text-3)', fontSize: 'clamp(12px, 2vw, 13px)', marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>
  </header>
);
