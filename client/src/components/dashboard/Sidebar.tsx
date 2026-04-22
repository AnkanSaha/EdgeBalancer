'use client';

import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';

interface SidebarProps {
  current: string;
  onNav: (id: string) => void;
  onLogout: () => void;
  userEmail?: string | null;
}

export const Sidebar = ({ current, onNav, onLogout, userEmail }: SidebarProps) => {
  const items = [
    { id: 'balancers', icon: 'Layers', label: 'Load Balancers' },
  ];

  const bottom = [
    { id: 'settings', icon: 'Settings', label: 'Settings' },
  ];

  return (
    <aside className="sidebar" style={{
      width: 240, borderRight: '1px solid var(--line)',
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      padding: '20px 12px', position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ padding: '0 8px 20px' }}>
        <Logo />
      </div>

      <div className="kicker" style={{ padding: '8px 12px', marginBottom: 4 }}>// workspace</div>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 'var(--radius)',
        border: '1px solid var(--line)', background: 'var(--bg-1)',
        marginBottom: 20, textAlign: 'left',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)',
        }}>
          {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'AL'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            My Workspace
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            free
          </div>
        </div>
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const Ico = Icons[it.icon as keyof typeof Icons];
          const active = current === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius)',
              background: active ? 'var(--bg-2)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-2)',
              fontSize: 13, textAlign: 'left',
              borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              paddingLeft: 10,
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
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>CF connected</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
          token • cf_live_••••
        </div>
      </div>

      {bottom.map(it => {
        const Ico = Icons[it.icon as keyof typeof Icons];
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 'var(--radius)',
            color: 'var(--text-2)', fontSize: 13,
          }}>
            <Ico size={15} /> {it.label}
          </button>
        );
      })}
      <button onClick={onLogout} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 'var(--radius)',
        color: 'var(--text-3)', fontSize: 13,
      }}>
        <Icons.Logout size={15} /> Log out
      </button>
    </aside>
  );
};

export const Topbar = ({ title, subtitle, actions, crumbs }: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  crumbs?: string[];
}) => (
  <header style={{
    padding: '24px 32px', borderBottom: '1px solid var(--line)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    gap: 16,
  }}>
    <div>
      {crumbs && (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
        }}>
          {crumbs.join(' / ')}
        </div>
      )}
      <h1 style={{ fontSize: 24, margin: 0, letterSpacing: '-0.02em', fontWeight: 500 }}>{title}</h1>
      {subtitle && (
        <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
    <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
  </header>
);
