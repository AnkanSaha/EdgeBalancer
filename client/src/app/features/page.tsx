import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { Icons } from '@/components/shared/Icons';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — EdgeBalancer',
  description:
    'EdgeBalancer features: 7 load balancing strategies, health checks, pause/resume, path routing, rate limiting, plus a full API Gateway with JWT, CORS, caching, canary, IP rules, mocks and more.',
  alternates: { canonical: 'https://edge.nexoral.in/features' },
};

type FeatureCard = {
  icon: keyof typeof Icons;
  title: string;
  desc: string;
};

const LB_STRATEGIES: FeatureCard[] = [
  { icon: 'Refresh', title: 'Round Robin', desc: 'Edge-local rotating cursor. Even distribution, no config needed.' },
  { icon: 'Activity', title: 'Weighted Round Robin', desc: 'Weighted random selection. Bigger origins get proportionally more traffic.' },
  { icon: 'Key', title: 'IP Hash', desc: 'Stable origin from cf-connecting-ip. Same client lands on same origin.' },
  { icon: 'Link', title: 'Cookie Sticky', desc: 'First request assigns an origin; affinity held by an httpOnly cookie.' },
  { icon: 'Layers', title: 'Weighted Cookie Sticky', desc: 'Weighted first assignment, then cookie affinity for stateful workloads.' },
  { icon: 'Shield', title: 'Failover', desc: 'Ordered retry. Advances to the next origin on 5xx or connection failure.' },
  { icon: 'Globe', title: 'Geo Steering', desc: 'Match by colo → country → continent, then fallback rotation.' },
];

const LB_EXTRAS: FeatureCard[] = [
  { icon: 'Activity', title: 'Health Checks', desc: 'Periodic origin checks. Unhealthy origins are skipped automatically.' },
  { icon: 'Refresh', title: 'Pause & Resume', desc: 'Pause to maintenance or paused Worker; resume with one click.' },
  { icon: 'Server', title: 'Multiple Origins', desc: 'Weighted origins with per-origin geo, fallback and failure settings.' },
  { icon: 'Flow', title: 'Path Routing', desc: 'Priority-based path rules route /api/* or /admin/* to specific origins.' },
  { icon: 'Shield', title: 'Rate Limiting', desc: 'Per-path requests-per-minute limits enforced directly at the edge.' },
  { icon: 'Globe', title: 'Smart Placement', desc: 'Cloudflare Smart Placement or pinned region for optimal latency.' },
];

const GATEWAY_FEATURES: FeatureCard[] = [
  { icon: 'Flow', title: 'Path Routing', desc: 'Prefix-based routing with priorities. /api/*, /admin/*, /* each to its own origin.' },
  { icon: 'Key', title: 'JWT HS256 Auth', desc: 'Verify Bearer tokens at the edge. Unauthenticated requests are rejected instantly.' },
  { icon: 'Globe', title: 'CORS Control', desc: 'Per-route CORS: allowed origins, methods, headers and credentials at the edge.' },
  { icon: 'Settings', title: 'Header Transforms', desc: 'Add, override or strip request and response headers per route.' },
  { icon: 'Cloud', title: 'Edge Caching', desc: 'Cache GET responses at the edge with per-route TTL. Cache hits never reach origins.' },
  { icon: 'Layers', title: 'Canary Releases', desc: 'Route a percentage of traffic to a canary origin. Weighted split with stable hashing.' },
  { icon: 'Lock', title: 'IP Allow / Deny', desc: 'Per-route allowlists and denylists. Block or permit CIDR ranges at the edge.' },
  { icon: 'Copy', title: 'Mock Responses', desc: 'Return static JSON directly from the edge. Ideal for staging and contract mocks.' },
  { icon: 'Activity', title: 'Rate Limiting', desc: 'Per-route requests-per-minute enforcement. 429 when the budget is exhausted.' },
];

function BentoCard({ feature }: { feature: FeatureCard }) {
  const Ico = Icons[feature.icon];
  return (
    <div className="feature-card" style={{ padding: 24 }}>
      <Ico size={20} stroke="var(--accent)" />
      <div style={{ fontSize: 15, fontWeight: 600, marginTop: 20, letterSpacing: '-0.01em' }}>{feature.title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.625 }}>{feature.desc}</div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section
          style={{
            maxWidth: 'min(1400px, 100vw)',
            margin: '0 auto',
            padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
          }}
        >
          <div className="kicker" style={{ marginBottom: 12 }}>// features</div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              margin: 0,
              letterSpacing: '-0.035em',
              fontWeight: 600,
              lineHeight: 1.05,
            }}
          >
            Everything at the edge<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px, 2.5vw, 18px)',
              color: 'var(--text-2)',
              maxWidth: 720,
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            Load balancers and API gateways deployed as Cloudflare Workers. No servers, no proxy —
            traffic never touches EdgeBalancer.
          </p>
        </section>

        {/* Load Balancer */}
        <section
          style={{
            maxWidth: 'min(1400px, 100vw)',
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 48px) clamp(40px, 5vw, 64px)',
          }}
        >
          <div className="kicker" style={{ marginBottom: 12 }}>// load balancer</div>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', margin: 0, letterSpacing: '-0.025em', fontWeight: 600, lineHeight: 1.05 }}>
            Seven strategies. One Worker.
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 15px)', color: 'var(--text-3)', maxWidth: 720, marginTop: 12, lineHeight: 1.6 }}>
            Pick the strategy that fits the workload. Switch anytime — updates use Worker Versions with automatic rollback.
          </p>

          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 28vw, 260px), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)',
            }}
          >
            {LB_STRATEGIES.map((f) => (
              <BentoCard key={f.title} feature={f} />
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 28vw, 260px), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)',
            }}
          >
            {LB_EXTRAS.map((f) => (
              <BentoCard key={f.title} feature={f} />
            ))}
          </div>

          <div
            className="feature-card"
            style={{
              marginTop: 16,
              padding: '16px 20px',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text-3)',
              lineHeight: 1.6,
            }}
          >
            <span>
              Health checks, origins, path routing, rate limits and placement are{' '}
              <span style={{ color: 'var(--text-2)' }}>configured per load balancer</span> and run entirely on the edge.
            </span>
            <a href="/strategies" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Explore strategies →
            </a>
          </div>
        </section>

        {/* API Gateway */}
        <section
          style={{
            maxWidth: 'min(1400px, 100vw)',
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
          }}
        >
          <div className="kicker" style={{ marginBottom: 12 }}>// api gateway</div>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 34px)', margin: 0, letterSpacing: '-0.025em', fontWeight: 600, lineHeight: 1.05 }}>
            Full gateway. Still a Worker.
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 15px)', color: 'var(--text-3)', maxWidth: 720, marginTop: 12, lineHeight: 1.6 }}>
            Path-based routing, auth, CORS, caching, canary, IP rules, mocks and rate limiting — all enforced at the edge before traffic hits your origins.
          </p>

          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 28vw, 260px), 1fr))',
              gap: 'clamp(12px, 2vw, 16px)',
            }}
          >
            {GATEWAY_FEATURES.map((f) => (
              <BentoCard key={f.title} feature={f} />
            ))}
          </div>

          <div
            className="feature-card"
            style={{
              marginTop: 16,
              padding: '16px 20px',
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--text-3)',
              lineHeight: 1.6,
            }}
          >
            <span>
              Every gateway feature runs <span style={{ color: 'var(--text-2)' }}>inside your Cloudflare Worker</span>. EdgeBalancer is only the control plane.
            </span>
            <a href="/pricing" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              See pricing →
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
