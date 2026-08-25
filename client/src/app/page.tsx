import { Icons } from '@/components/shared/Icons';
import { WebSiteSchema, SoftwareApplicationSchema, FAQPageSchema, OrganizationSchema } from '@/components/shared/JsonLd';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { ScrollAnimator } from '@/components/landing/ScrollAnimator';
import { CTAButton } from '@/components/landing/CTAButton';
import { HeroStats } from '@/components/landing/HeroStats';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EdgeBalancer — Deploy Cloudflare Load Balancers & API Gateways in 60 Seconds',
  description: 'No-code control plane for Cloudflare Workers: 7 LB strategies, health checks, and 9 gateway features — JWT, caching, canary, IP rules. Live on 330+ PoPs. Free tier.',
  alternates: { canonical: 'https://edge.nexoral.in' },
  keywords: ['cloudflare workers', 'load balancer', 'api gateway', 'cloudflare load balancing alternative', 'edge computing', 'serverless load balancer'],
};

const FAQS = [
  { question: 'How is this different from Cloudflare Load Balancing?', answer: 'Cloudflare Load Balancing is DNS-based ($5/balancer + per-query). EdgeBalancer deploys as a Worker — request-level control, no per-query costs. 100k req/day free on Cloudflare.' },
  { question: 'What happens if EdgeBalancer goes down?', answer: "Your Workers keep running. Once deployed, the script lives in your Cloudflare account. We're only the control plane — the data plane runs on Cloudflare's edge." },
  { question: 'Can I see the generated code?', answer: 'Yes. Every Worker is visible in your Cloudflare dashboard. Generated from strategy-specific templates — download, review, modify.' },
  { question: 'How do updates work?', answer: 'Cloudflare Worker Versions. New version deployed, old version kept as rollback. Zero-downtime.' },
  { question: 'Do you see my traffic?', answer: 'No. We store only metadata (origins, weights, strategy) encrypted in MongoDB. Traffic flows directly from Cloudflare edge to your origins.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <WebSiteSchema />
      <SoftwareApplicationSchema />
      <OrganizationSchema />
      <FAQPageSchema faqs={FAQS} />
      <ScrollAnimator />
      <style>{`
        .pricing-layout { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 768px) { .pricing-layout { grid-template-columns: 1fr !important; } }
        .features-two-col { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) { .features-two-col { grid-template-columns: 1fr !important; } }
        .steps-three { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 768px) { .steps-three { grid-template-columns: 1fr !important; } }
        .hero-two-col { grid-template-columns: 1fr 1fr; }
        @media (max-width: 768px) { .hero-two-col { grid-template-columns: 1fr !important; } }
      `}</style>

      <Nav />

      <main>
        {/* Hero */}
        <section className="hero-two-col" style={{
          display: 'grid',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'center',
          padding: 'clamp(64px, 10vh, 120px) clamp(16px, 4vw, 48px) clamp(48px, 8vh, 80px)',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              border: '1px solid var(--line)',
              fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
              marginBottom: 24,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              Deployed on 330+ Cloudflare PoPs
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 1.05,
              letterSpacing: '-0.03em', fontWeight: 700, margin: 0,
            }}>
              Load balancers<br />
              &amp; gateways<br />
              <span style={{ color: 'var(--accent)' }}>in 60 seconds.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-2)',
              marginTop: 20, lineHeight: 1.6, maxWidth: 480,
            }}>
              Pick origins, pick a strategy. We deploy the Worker to your Cloudflare account.
              7 routing strategies, 9 gateway features, health checks. Free to start.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              <CTAButton />
              <a href="/stats" className="btn btn-ghost btn-sm">
                <Icons.Activity size={14} /> Live stats
              </a>
              <a href="/developers" className="btn btn-ghost btn-sm">
                <Icons.Server size={14} /> API docs
              </a>
            </div>

            <HeroStats />
          </div>

          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            fontFamily: 'var(--mono)', fontSize: 12,
          }}>
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#eab308' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>worker.js — failover strategy</span>
            </div>
            <pre style={{ margin: 0, padding: '20px', lineHeight: 1.8, color: 'var(--text-2)', overflowX: 'auto' }}>
{`export default {
  async fetch(request) {
    const origins = [
      { url: 'https://api1.example.com', weight: 80 },
      { url: 'https://api2.example.com', weight: 20 },
    ];

    const healthy = await checkHealth(origins);
    const selected = failover(healthy);

    return fetch(request, selected.url);
  }
}`}
            </pre>
          </div>
        </section>

        {/* Proof strip */}
        <section style={{
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
          padding: '24px clamp(16px, 4vw, 48px)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24,
        }}>
          {[
            { value: '330+', label: 'Cloudflare PoPs' },
            { value: '~14ms', label: 'p50 latency' },
            { value: '7', label: 'routing strategies' },
            { value: '$0', label: 'free tier, 5 LBs' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center', flex: '1 1 120px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>how it works</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Three steps. No servers to manage.
            </h2>
          </div>

          <div className="steps-three" style={{ display: 'grid', gap: 32 }}>
            {[
              { num: '01', title: 'Connect Cloudflare', desc: 'Paste a scoped API token. We encrypt it with AES-256-GCM. Your account, your Workers.' },
              { num: '02', title: 'Pick your setup', desc: 'Choose a load balancer strategy or gateway features. Health checks, JWT, caching — all configurable.' },
              { num: '03', title: 'Deploy', desc: 'We push a Worker to your account on 330+ PoPs. Delete the token anytime — Workers keep running.' },
            ].map((step) => (
              <div key={step.num}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 12 }}>{step.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>features</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div className="features-two-col" style={{ display: 'grid', gap: 'clamp(32px, 5vw, 48px)' }}>
            <div>
              <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 20, fontFamily: 'var(--mono)' }}>Load Balancer</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { name: 'Round Robin', desc: 'Equal distribution' },
                  { name: 'Weighted Round Robin', desc: 'Proportional by weight' },
                  { name: 'IP Hash', desc: 'Same client, same origin' },
                  { name: 'Sticky Sessions', desc: 'Cookie-based affinity' },
                  { name: 'Weighted Sticky', desc: 'Weighted first, then sticky' },
                  { name: 'Failover', desc: 'Automatic backup on failure' },
                  { name: 'Geographic', desc: 'Route by visitor location' },
                ].map((s) => (
                  <div key={s.name} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--accent)', fontSize: 14 }}>→</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 8 }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 20, fontFamily: 'var(--mono)' }}>API Gateway</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { name: 'JWT Validation', desc: 'HS256/384/512' },
                  { name: 'Response Caching', desc: 'Workers Cache API' },
                  { name: 'Canary Splitting', desc: 'Percentage-based' },
                  { name: 'IP Rules', desc: 'Allow/deny by CIDR' },
                  { name: 'Mock Routes', desc: 'Canned JSON responses' },
                  { name: 'Rate Limiting', desc: '3-layer ladder' },
                  { name: 'Path Routing', desc: 'Prefix matching' },
                  { name: 'CORS', desc: 'Preflight handling' },
                  { name: 'Header Transforms', desc: 'Rewrite at edge' },
                ].map((f) => (
                  <div key={f.name} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--accent)', fontSize: 14 }}>→</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{f.name}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 8 }}>{f.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/features" className="btn btn-ghost btn-sm">All features →</a>
            <a href="/strategies" className="btn btn-ghost btn-sm">Strategies in detail →</a>
          </div>
        </section>

        {/* MCP */}
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>mcp server</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Your AI agent&apos;s load balancer API.
            </h2>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-2)', marginTop: 12, lineHeight: 1.6, maxWidth: 560 }}>
              One endpoint. 15 tools. Create, update, pause, delete — your AI manages infrastructure like code.
            </p>
          </div>

          <div style={{
            marginBottom: 32, padding: '12px 16px', borderRadius: 'var(--radius)',
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--text-3)' }}>https://</span>apiedge.nexoral.in<span style={{ color: 'var(--accent)' }}>/mcp</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 32 }}>
            {[
              'list_load_balancers', 'get_load_balancer', 'create_load_balancer', 'update_load_balancer', 'delete_load_balancer', 'pause_load_balancer', 'resume_load_balancer',
              'list_gateways', 'get_gateway', 'create_gateway', 'update_gateway', 'delete_gateway', 'pause_gateway', 'resume_gateway',
              'list_zones',
            ].map((tool, i) => (
              <span key={tool} style={{
                padding: '4px 8px', borderRadius: 'var(--radius)',
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ color: i < 7 ? 'var(--accent)' : i < 14 ? '#a855f7' : 'var(--green)' }}>●</span> {tool}
              </span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {[
              { name: 'Claude Code', cmd: 'claude mcp add edgebalancer --transport http https://apiedge.nexoral.in/mcp' },
              { name: 'Cursor', cmd: '"url": "https://apiedge.nexoral.in/mcp"' },
              { name: 'OpenCode', cmd: '"type": "http", "url": "https://apiedge.nexoral.in/mcp"' },
              { name: 'Codex', cmd: 'url = "https://apiedge.nexoral.in/mcp"' },
            ].map((client) => (
              <div key={client.name} className="feature-card" style={{ padding: '14px 16px', overflow: 'hidden' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{client.name}</div>
                <code style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all', lineHeight: 1.5 }}>{client.cmd}</code>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <a href="/developers" className="btn btn-ghost btn-sm">MCP docs →</a>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>pricing</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Simple. No surprises.
            </h2>
          </div>

          <div className="pricing-layout" style={{ display: 'grid', gap: 16 }}>
            <div className="feature-card" style={{ padding: 24 }}>
              <div className="kicker" style={{ marginBottom: 8 }}>free</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>₹0</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>forever</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Up to 5 load balancers', 'All 7 strategies', 'Health checks (2 LBs)', 'Deployment history', 'Pause / resume'].map((f) => (
                  <div key={f} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--green)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card" style={{ padding: 24, border: '1px solid var(--accent)' }}>
              <div className="kicker" style={{ color: 'var(--accent)', marginBottom: 8 }}>student</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>₹49<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>30 days</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Up to 10 load balancers', 'All 7 strategies', 'Health checks (5 LBs)', 'Analytics & script download', 'Smart Placement'].map((f) => (
                  <div key={f} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card" style={{ padding: 24, border: '1px solid var(--accent)' }}>
              <div className="kicker" style={{ marginBottom: 8 }}>pro</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>₹299<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>30 days</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Unlimited load balancers', 'All 7 strategies', 'Unlimited health checks', 'AI Agent', 'Rate Limiting', 'Analytics & script download'].map((f) => (
                  <div key={f} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-3)' }}>
            Free trial available — <span style={{ color: 'var(--accent)' }}>no credit card required</span>.
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ marginBottom: 40 }}>
            <div className="kicker" style={{ marginBottom: 12 }}>faq</div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Questions &amp; Answers
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 800 }}>
            {FAQS.map((faq, i) => (
              <details key={i} className="feature-card" style={{ padding: '16px 20px' }}>
                <summary style={{ fontSize: 15, fontWeight: 600, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
                  <span>{faq.question}</span>
                  <Icons.ChevronDown size={16} style={{ flexShrink: 0 }} />
                </summary>
                <div style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', lineHeight: 1.6 }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: 'clamp(64px, 10vh, 120px) clamp(16px, 4vw, 48px)',
          textAlign: 'center', borderTop: '1px solid var(--line)',
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Start free. No credit card.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', marginTop: 16, marginBottom: 32 }}>
            5 load balancers, all strategies, health checks. Deploy in 60 seconds.
          </p>
          <CTAButton />
        </section>
      </main>

      <Footer />
    </div>
  );
}
