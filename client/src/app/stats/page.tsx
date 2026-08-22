import type { Metadata } from 'next';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { Icons } from '@/components/shared/Icons';
import { StatsClient } from './StatsClient';

export const metadata: Metadata = {
  title: 'EdgeBalancer — Live Stats',
  description:
    'Live EdgeBalancer platform stats — users, load balancers, gateways and origins. Real counts visible after sign in on Overview.',
  alternates: { canonical: 'https://edge.nexoral.in/stats' },
};

export default function StatsPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="topo" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        <section
          style={{
            maxWidth: 'min(1400px, 100vw)',
            margin: '0 auto',
            padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 48px) clamp(24px, 4vw, 32px)',
          }}
        >
          <div
            className="feature-card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderRadius: 999,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-2)',
              marginBottom: 20,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} />
            Live platform stats
          </div>

          <h1
            style={{
              fontSize: 'clamp(30px, 5vw, 52px)',
              margin: 0,
              letterSpacing: '-0.035em',
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            EdgeBalancer at a glance<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(14px, 2.2vw, 16px)',
              color: 'var(--text-2)',
              maxWidth: 760,
              marginTop: 16,
              lineHeight: 1.6,
            }}
          >
            Real counts from production — users, balancers, gateways and the origins behind them.
          </p>
        </section>

        <section
          style={{
            maxWidth: 'min(1400px, 100vw)',
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
          }}
        >
          <StatsClient />
        </section>


      </main>

      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
