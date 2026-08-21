'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';

export function Nav() {
  const router = useRouter();
  const { user, loading } = useAuth();

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 30,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 48px)', borderBottom: '1px solid var(--line)',
      flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)',
      background: '#0a0a0fcc',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    }}>
      <a href="/" style={{ textDecoration: 'none' }}>
        <Logo />
      </a>
      <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="hide-sm" style={{ display: 'flex', gap: 'clamp(12px, 2vw, 20px)', marginRight: 'clamp(8px, 2vw, 16px)', fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-2)' }}>
          <a href="/strategies" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>Strategies</a>
          <a href="/pricing" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>Pricing</a>
          <a href="/blog" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>Blog</a>
          <a href="/faq" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>FAQ</a>
        </div>
        {!loading && (
          user ? (
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/overview')} style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>
              Overview <Icons.Arrow size={14} />
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/login')} style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>Sign in</button>
              <button className="btn btn-primary btn-sm" onClick={() => router.push('/register')} style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>
                Get started <Icons.Arrow size={14} />
              </button>
            </>
          )
        )}
      </div>
    </nav>
  );
}
