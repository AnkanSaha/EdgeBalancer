import type { Metadata } from 'next';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'About',
  description: 'EdgeBalancer — a no-code control plane for Cloudflare Worker load balancers and API gateways, built for solo devs and small teams.',
  alternates: { canonical: 'https://edge.nexoral.in/about' },
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 'clamp(80px, 12vw, 140px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', letterSpacing: '-0.03em', fontWeight: 700, marginBottom: 32 }}>
          About EdgeBalancer
        </h1>
        <div style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', color: 'var(--text-2)', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p>
            EdgeBalancer is a no-code control plane that deploys Cloudflare Worker-based load balancers and API gateways. You connect your Cloudflare account, pick origins and a routing strategy, and we generate and deploy the Worker script to your account on 330+ Cloudflare PoPs.
          </p>
          <p>
            We built EdgeBalancer because deploying intelligent traffic routing on Cloudflare Workers shouldn&apos;t require writing Worker code, wiring the Cloudflare API, or hand-rolling rollback logic. The Worker runs entirely in your Cloudflare account — EdgeBalancer is the control plane that creates and updates it.
          </p>
          <p>
            Once deployed, your load balancers keep running even if EdgeBalancer is down. The Worker script lives in your account. You maintain full control: delete the API token and the Workers stay deployed. Rotate your token and the control plane loses access instantly.
          </p>
          <p>
            EdgeBalancer supports 7 routing strategies for load balancing (round-robin, weighted round-robin, IP hash, sticky sessions, weighted sticky sessions, failover, and geographic steering) and 9 API gateway features (JWT validation, header transforms, response caching, canary splitting, IP allow/deny, mock routes, rate limiting, path routing, and CORS).
          </p>
          <p>
            We are a small, independent team focused on making edge infrastructure accessible to solo developers and small teams. Our pricing is simple: a free tier that runs a real website, a student plan at ₹49/month, and a pro plan at ₹299/month. All plans are one-time payments with no auto-renewal.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
