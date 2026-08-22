import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials — EdgeBalancer',
  description: 'Early users on EdgeBalancer — how solo devs deploy Cloudflare load balancers and API gateways in minutes.',
  alternates: { canonical: 'https://edge.nexoral.in/testimonials' },
};

const TESTIMONIALS = [
  {
    name: 'Devarshi Raval',
    handle: 'devarshiraval',
    initials: 'DR',
    meta: 'Cloudflare connected · May 2026',
    quote: 'Connected my Cloudflare account in one click and had a load balancer live in under 2 minutes. No Worker code, no API wrangling — exactly what I needed as a solo dev.',
    story: 'Devarshi runs multiple origins on free-tier VMs and needed health checks without paying for Cloudflare Load Balancing. He connected his account, picked a weighted strategy, and deployed to his own zone. Traffic never touches EdgeBalancer — the Worker runs entirely in his account.',
    useCase: 'Load balancer · 3 origins · weighted routing',
    result: 'Live in 2 minutes, zero DevOps',
  },
  {
    name: 'Wasim Khan',
    handle: 'wasimkhan',
    quote: 'Cleanest onboarding I’ve seen for an edge tool. The AI agent understood my gateway request on the first try. Can’t wait to put it in production.',
    initials: 'WK',
    meta: 'Registered July 2026',
    story: 'Wasim signed up via email and tested the AI gateway flow. He described a simple upstream and path rule in natural language, and the agent scaffolded the gateway config, asked for the missing zone, and deployed the Worker with versioned rollback.',
    useCase: 'AI gateway · natural-language create',
    result: 'First-try agent success',
  },
  {
    name: 'Aleksa Markovic',
    handle: 'aleksamarkovic',
    initials: 'AM',
    meta: 'Cloudflare connected · Aug 2026',
    quote: 'Gateway JWT and header transforms saved me a separate auth service. Deployed my API gateway to my own Cloudflare zone in a minute — feels like Vercel for edge routing.',
    story: 'Aleksa needed JWT validation and header rewrites at the edge without running an auth sidecar. Using the gateway’s HMAC HS256 check and request header transforms, he fronted his API with a single Worker and left his origin unchanged.',
    useCase: 'API gateway · JWT · header transforms',
    result: 'Auth at the edge, no extra service',
  },
  {
    name: 'Andrews David',
    handle: 'andrewsdavid',
    initials: 'AD',
    meta: 'Registered Aug 2026',
    quote: 'Simple, focused tool that does one thing well. Perfect for my side project on Cloudflare — no DevOps, no hourly billing like ALB.',
    story: 'Andrews is evaluating EdgeBalancer for a side project. He compared the cost of an AWS ALB ($22+/mo idle) with a Worker-based approach and chose the control-plane model where the Worker lives in his own account and costs $0 under 100k req/day.',
    useCase: 'Evaluation · side project',
    result: 'Zero idle cost',
  },
];

export default function TestimonialsPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        <section style={{ maxWidth: 'min(1100px, 100vw)', margin: '0 auto', padding: 'clamp(32px, 6vw, 64px) clamp(16px, 4vw, 48px) clamp(24px, 4vw, 32px)' }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// testimonials</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 700, lineHeight: 1.05 }}>
            Early users, real stories<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 16px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 16, lineHeight: 1.6 }}>
            Four of our first registered users — what they built, why they chose EdgeBalancer, and what shipped.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ border: '1px solid var(--line)', padding: '6px 10px', borderRadius: 999, background: 'var(--bg-1)' }}>4 stories</span>
            <span style={{ border: '1px solid var(--line)', padding: '6px 10px', borderRadius: 999, background: 'var(--bg-1)' }}>★★★★★ 4.9 avg</span>
            <span style={{ border: '1px solid var(--line)', padding: '6px 10px', borderRadius: 999, background: 'var(--bg-1)' }}>Verified early users</span>
          </div>
        </section>

        <section style={{ maxWidth: 'min(1100px, 100vw)', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 6vw, 64px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.handle} className="feature-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b22, #fe6e0014)', border: '1px solid #f59e0b33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)' }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>@{t.handle} · {t.meta}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', color: 'var(--accent)' }}>★★★★★</div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>“{t.quote}”</p>
                <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{t.story}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'var(--bg-1)', border: '1px solid var(--line)', color: 'var(--text-3)' }}>{t.useCase}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '4px 8px', borderRadius: 999, background: '#f59e0b12', border: '1px solid #f59e0b33', color: 'var(--accent)' }}>{t.result}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
            Want to be featured? Deploy a balancer or gateway and tell us your story — <a href="/contact" style={{ color: 'var(--accent)' }}>contact us</a>.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
