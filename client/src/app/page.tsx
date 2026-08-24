import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';

import { WebSiteSchema, SoftwareApplicationSchema, FAQPageSchema, OrganizationSchema } from '@/components/shared/JsonLd';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { ScrollAnimator } from '@/components/landing/ScrollAnimator';
import { CTAButton, SecondaryCTA } from '@/components/landing/CTAButton';
import { HeroStats } from '@/components/landing/HeroStats';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EdgeBalancer — Deploy Cloudflare Load Balancers & API Gateways in 60 Seconds',
  description: 'No-code control plane for Cloudflare Workers: 7 LB strategies, health checks, and 9 gateway features — JWT, caching, canary, IP rules. Live on 330+ PoPs. Free tier.',
  alternates: { canonical: 'https://edge.nexoral.in' },
  keywords: ['cloudflare workers', 'load balancer', 'api gateway', 'cloudflare load balancing alternative', 'edge computing', 'serverless load balancer'],
};

const FAQS = [
  { question: 'How is this different from Cloudflare Load Balancing?', answer: 'Cloudflare Load Balancing is a DNS-based solution ($5/balancer + per-query fees). EdgeBalancer deploys as a Worker script, giving you request-level control with no per-query costs. You pay only for Worker requests (100k/day free, then $0.30/M).' },
  { question: 'Can I bring my own domains?', answer: 'Yes. You connect your Cloudflare account, and we deploy Workers to zones you already own. You maintain full control — delete the API token and the Workers stay deployed under your account.' },
  { question: 'What happens if EdgeBalancer goes down?', answer: "Your load balancers keep running. Once deployed, the Worker script lives in your Cloudflare account. EdgeBalancer is only the control plane for creating and updating configs — the data plane runs independently on Cloudflare's edge." },
  { question: 'How do updates work?', answer: 'Updates use Cloudflare Worker Versions and Deployments. When you change a config, we create a new version, deploy it, and keep the previous version as a rollback target. Old inactive versions are pruned automatically.' },
  { question: 'Can I see the generated Worker code?', answer: "Yes. All Worker scripts are visible in your Cloudflare dashboard under Workers & Pages. The code is generated from strategy-specific templates." },
  { question: 'What are the performance implications?', answer: 'Workers add ~1-3ms median overhead. The benefit is intelligent routing, health checks, and failover at the edge — much faster than round-tripping to a centralized load balancer.' },
  { question: 'Do you store or proxy my traffic?', answer: 'No. EdgeBalancer never sees your production traffic. We store only metadata (origin URLs, weights, strategy choice) encrypted in MongoDB. All requests flow directly from Cloudflare edge to your origins.' },
  { question: 'How do I delete everything?', answer: "Delete load balancers from the dashboard, then rotate your API token. You can also manually delete the Worker scripts from Cloudflare's dashboard. EdgeBalancer has no lock-in — everything runs in your account." },
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
        .hero-vh { min-height: 100vh; }
        @media (max-width: 1024px) { .hero-vh { min-height: auto !important; } }
      `}</style>

      <Nav />

      {/* Hero */}
      <main>
        <section className="hero-grid hero-vh" style={{
          position: 'relative', zIndex: 5,
          padding: 'clamp(48px, 6vw, 96px) clamp(20px, 5vw, 80px) clamp(40px, 5vw, 64px)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 999,
              fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 13px)', color: 'var(--text-3)',
              marginBottom: 'clamp(16px, 3vw, 24px)',
              border: '1px solid var(--line)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              Deployed on 330+ Cloudflare PoPs
            </div>
            <h1 className="animate-slide-up stagger-1" style={{
              fontSize: 'clamp(32px, 6vw, 72px)', lineHeight: 0.98,
              letterSpacing: '-0.035em', fontWeight: 600, margin: 0,
            }}>
              Load balancers
              <br />
              &amp; gateways <span style={{ color: 'var(--accent)' }}>in 60 seconds.</span>
            </h1>
            <p className="animate-slide-up stagger-2" style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 520,
              marginTop: 'clamp(16px, 3vw, 24px)', lineHeight: 1.625,
            }}>
              No Worker code. Pick origins, pick a strategy — we deploy the Worker to <em>your</em> Cloudflare account on 330+ PoPs.
              <span style={{ color: 'var(--text)', fontWeight: 600 }}> 7 LB strategies + 9 gateway features</span> — JWT, caching, canary, IP rules.
            </p>
            <div className="animate-slide-up stagger-3" style={{ display: 'flex', gap: 12, marginTop: 'clamp(24px, 4vw, 36px)', flexWrap: 'wrap' }}>
              <CTAButton />
              <a href="/stats" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', border: '1px solid var(--line)', padding: '10px 16px', borderRadius: 'var(--radius)' }}>
                <Icons.Activity size={14} /> View live stats
              </a>
              <a href="/developers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', border: '1px solid var(--line)', padding: '10px 16px', borderRadius: 'var(--radius)' }}>
                <Icons.Server size={14} /> API docs
              </a>
            </div>
            <HeroStats />
            <div className="animate-slide-up stagger-4" style={{
              display: 'flex', gap: 'clamp(16px, 3vw, 32px)', marginTop: 'clamp(24px, 4vw, 32px)', flexWrap: 'wrap',
              fontFamily: 'var(--mono)', fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              <div><span style={{ color: 'var(--accent)' }}>330+</span> PoPs</div>
              <div><span style={{ color: 'var(--accent)' }}>~14ms</span> p50 rtt</div>
              <div><span style={{ color: 'var(--accent)' }}>Workers</span> in your account</div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <div style={{
              width: '100%', maxWidth: 480,
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
                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>worker.js</span>
              </div>
              <pre style={{ margin: 0, padding: '16px 18px', lineHeight: 1.8, color: 'var(--text-2)', overflowX: 'auto' }}>
{`export default {
  async fetch(request) {
    const origins = getHealthyOrigins();
    const selected = failover(origins, request);
    return fetch(request, selected.url);
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Problem → Solution (bento) */}
        <section id="who" style={{
          position: 'relative', zIndex: 5,

          padding: 'clamp(40px, 5vw, 56px) clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
          borderBottom: '1px solid var(--line)',
        }}>
          <div className="kicker" style={{ marginBottom: 'clamp(12px, 2vw, 16px)', fontSize: 'clamp(9px, 2vw, 11px)' }}>// the problem</div>
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 34px)', margin: 0, letterSpacing: '-0.025em',
            fontWeight: 600, lineHeight: 1.05, maxWidth: 720,
          }}>
            Cloudflare can do it — but you have to write the Worker, handle the API, and get rollback right.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 32 }}>
            {[
              { title: 'Write the Worker by hand', desc: '7 strategies × edge cases × CORS × failover. One typo and traffic goes nowhere.', cost: 'Hours of JS' },
              { title: 'Wire the Cloudflare API', desc: 'Deploy script, version it, attach domain, handle 4 token permissions, DNS records for IP origins.', cost: '$22+/mo ALB or $5/mo CF LB' },
              { title: 'No safe rollback', desc: 'Update fails halfway? You hand-roll a revert while users see 502s. We use Version Deployments + DB snapshot.', cost: 'Zero-downtime lost' },
            ].map((c, i) => (
              <div key={i} className="feature-card" style={{ padding: 20 }}>
                <div className="kicker" style={{ fontSize: 10, color: 'var(--red)' }}>{c.cost}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 13, color: 'var(--green)' }}>→ EdgeBalancer:</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Your Worker runs in <em>your</em> account — under 100k req/day <span className="mono" style={{ color: 'var(--green)' }}>$0</span>. No servers, no base fee, no idle rent. Solo-devs on Oracle Free Tier, Railway, Workers — this is for you.</span>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <CTAButton className="btn btn-primary" size="sm" />
            <SecondaryCTA />
          </div>
        </section>

        {/* Feature strip */}
        <section style={{
          position: 'relative', zIndex: 5,
 padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 48px) clamp(40px, 5vw, 64px)',
        }}>
          <div className="kicker" style={{ marginBottom: 'clamp(16px, 3vw, 24px)', fontSize: 'clamp(9px, 2vw, 11px)' }}>// how it works — LB + gateway</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 50vw, 240px), 1fr))',
            gap: 'clamp(12px, 2vw, 16px)',
          }}>
            {[
              { icon: 'Key', title: '01 · Paste API token', desc: 'Scoped Workers + Zone edit token. AES-256-GCM at rest.' },
              { icon: 'Zap', title: '02 · Pick LB or gateway', desc: 'LB: 7 strategies. Gateway: JWT, caching, canary, IP rules, mocks.' },
              { icon: 'Globe', title: '03 · Deploy worker', desc: 'We compile + push a Worker to *your* account on 330+ PoPs. Versioned deploys.' },
              { icon: 'Activity', title: '04 · You own it', desc: "Traffic never touches us. Rollback, pause, delete — all in your account." },
            ].map((f, i) => {
              const Ico = Icons[f.icon as keyof typeof Icons];
              return (
                <div key={i} className="feature-card animate-on-scroll fade-in-up" style={{ padding: 28, animationDelay: `${i * 0.1}s` }}>
                  <Ico size={20} stroke="var(--accent)" />
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 20, letterSpacing: '-0.01em' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.625 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* MCP Section — AI-native control plane */}
        <section id="mcp" style={{
          position: 'relative', zIndex: 5,

          padding: 'clamp(40px, 5vw, 64px) clamp(16px, 2vw, 32px)',
        }}>
          <div style={{ position: 'relative' }}>
            {/* Top: badge + heading + endpoint */}
            <div style={{ textAlign: 'center', marginBottom: 'clamp(32px, 4vw, 48px)' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 999,
                background: 'linear-gradient(135deg, #f59e0b12, #a855f712)',
                border: '1px solid #f59e0b30', marginBottom: 20,
              }}>
                <Icons.Log size={14} stroke="var(--accent)" />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MCP Server</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, lineHeight: 1.1 }}>
                Your AI agent's<br />load balancer API<span style={{ color: 'var(--accent)' }}>.</span>
              </h2>
              <p style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', color: 'var(--text-2)', margin: '16px auto 0', lineHeight: 1.6 }}>
                One endpoint. 15 tools. Create, update, pause, delete — your AI manages infrastructure like code.
              </p>
            </div>

            {/* Endpoint bar */}
            <div className="animate-on-scroll fade-in-up" style={{
              marginBottom: 40,
              padding: '14px 20px', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: 'none',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(12px, 2vw, 14px)', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'var(--text-3)' }}>https://</span>apiedge.nexoral.in<span style={{ color: 'var(--accent)' }}>/mcp</span>
              </span>
            </div>

            {/* Tool grid */}
            <div style={{ marginBottom: 'clamp(32px, 4vw, 48px)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>15 tools available</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {[
                  'list_load_balancers', 'get_load_balancer', 'create_load_balancer', 'update_load_balancer', 'delete_load_balancer', 'pause_load_balancer', 'resume_load_balancer',
                  'list_gateways', 'get_gateway', 'create_gateway', 'update_gateway', 'delete_gateway', 'pause_gateway', 'resume_gateway',
                  'list_zones',
                ].map((tool, i) => (
                  <div key={tool} className="animate-on-scroll scale-in" style={{
                    padding: '5px 10px', borderRadius: 'var(--radius)',
                    background: 'var(--bg-1)', border: '1px solid var(--line)',
                    fontFamily: 'var(--mono)', fontSize: 'clamp(10px, 1.8vw, 11px)',
                    color: 'var(--text-3)', animationDelay: `${i * 0.03}s`,
                    whiteSpace: 'nowrap',
                  }}>
                    <span style={{ color: i < 7 ? 'var(--accent)' : i < 14 ? '#a855f7' : 'var(--green)' }}>●</span> {tool}
                  </div>
                ))}
              </div>
            </div>

            {/* Client configs — terminal style */}
            <div>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connect in one step</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 45vw, 320px), 1fr))', gap: 12 }}>
                {[
                  {
                    name: 'Claude Code',
                    icon: <Icons.Log size={14} stroke="#a855f7" />,
                    lines: [
                      { text: '$ ', color: 'var(--text-3)' },
                      { text: 'claude mcp add edgebalancer \\' , color: 'var(--text)' },
                      { text: '  --transport http \\', color: 'var(--text)' },
                      { text: '  https://apiedge.nexoral.in/mcp', color: 'var(--accent)' },
                    ],
                  },
                  {
                    name: 'Cursor',
                    icon: <Icons.Edit size={14} stroke="#54a2ff" />,
                    lines: [
                      { text: '// Settings → MCP Servers', color: 'var(--text-3)' },
                      { text: '{', color: 'var(--text)' },
                      { text: '  "mcpServers": {', color: 'var(--text)' },
                      { text: '    "edgebalancer": {', color: 'var(--text-2)' },
                      { text: '      "url": "https://apiedge.nexoral.in/mcp"', color: 'var(--accent)' },
                      { text: '    }', color: 'var(--text-2)' },
                      { text: '  }', color: 'var(--text)' },
                      { text: '}', color: 'var(--text)' },
                    ],
                  },
                  {
                    name: 'OpenCode',
                    icon: <Icons.Zap size={14} stroke="var(--green)" />,
                    lines: [
                      { text: '// opencode.json', color: 'var(--text-3)' },
                      { text: '{', color: 'var(--text)' },
                      { text: '  "mcp": {', color: 'var(--text)' },
                      { text: '    "edgebalancer": {', color: 'var(--text-2)' },
                      { text: '      "type": "http",', color: 'var(--text)' },
                      { text: '      "url": "https://apiedge.nexoral.in/mcp"', color: 'var(--accent)' },
                      { text: '    }', color: 'var(--text-2)' },
                      { text: '  }', color: 'var(--text)' },
                      { text: '}', color: 'var(--text)' },
                    ],
                  },
                  {
                    name: 'Codex',
                    icon: <Icons.Server size={14} stroke="var(--orange)" />,
                    lines: [
                      { text: '# ~/.codex/config.toml', color: 'var(--text-3)' },
                      { text: '[mcp_servers.edgebalancer]', color: 'var(--text-2)' },
                      { text: 'url = "https://apiedge.nexoral.in/mcp"', color: 'var(--accent)' },
                      { text: 'transport = "http"', color: 'var(--text)' },
                    ],
                  },
                  {
                    name: 'Anti Gravity',
                    icon: <Icons.Shield size={14} stroke="#ff6568" />,
                    lines: [
                      { text: '// Settings → MCP Servers', color: 'var(--text-3)' },
                      { text: '{', color: 'var(--text)' },
                      { text: '  "edgebalancer": {', color: 'var(--text-2)' },
                      { text: '    "url": "https://apiedge.nexoral.in/mcp",', color: 'var(--accent)' },
                      { text: '    "transport": "http"', color: 'var(--text)' },
                      { text: '  }', color: 'var(--text-2)' },
                      { text: '}', color: 'var(--text)' },
                    ],
                  },
                  {
                    name: 'Command Code',
                    icon: <Icons.Log size={14} stroke="var(--accent)" />,
                    lines: [
                      { text: '// .commandcode/config.json', color: 'var(--text-3)' },
                      { text: '{', color: 'var(--text)' },
                      { text: '  "mcpServers": {', color: 'var(--text)' },
                      { text: '    "edgebalancer": {', color: 'var(--text-2)' },
                      { text: '      "url": "https://apiedge.nexoral.in/mcp",', color: 'var(--accent)' },
                      { text: '      "transport": "http"', color: 'var(--text)' },
                      { text: '    }', color: 'var(--text-2)' },
                      { text: '  }', color: 'var(--text)' },
                      { text: '}', color: 'var(--text)' },
                    ],
                  },
                ].map((client, i) => (
                  <div key={client.name} className="feature-card animate-on-scroll fade-in-up" style={{
                    padding: 0, overflow: 'hidden', animationDelay: `${i * 0.06}s`,
                    border: '1px solid var(--line)',
                  }}>
                    {/* Terminal title bar */}
                    <div style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--line)',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--bg-1)',
                    }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e' }} />
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840' }} />
                      </div>
                      <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {client.icon}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{client.name}</span>
                      </div>
                    </div>
                    {/* Code lines */}
                    <pre style={{
                      margin: 0, padding: '14px 16px',
                      background: 'var(--bg)',
                      fontFamily: 'var(--mono)',
                      fontSize: 'clamp(11px, 1.8vw, 12px)',
                      lineHeight: 1.7,
                      overflowX: 'auto',
                    }}>
                      {client.lines.map((line, j) => (
                        <div key={j} style={{ color: line.color, whiteSpace: 'pre' }}>{line.text || '\u00A0'}</div>
                      ))}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>


        {/* Gateway — 9 features */}
        <section style={{
          position: 'relative', zIndex: 5,

          padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// api gateway</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600 }}>
            All the gateway features you expect<span style={{ color: 'var(--accent)' }}>.</span>
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 16px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 16, lineHeight: 1.6 }}>
            JWT validation, header transforms, response caching, canary splitting, IP allow/deny, mocks and rate limiting — one generated Worker, no extra infra.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 32 }}>
            {[
              { icon: 'Key', title: 'JWT validation', desc: 'HMAC HS256/384/512 via Web Crypto. Secrets AES-256-GCM encrypted.' },
              { icon: 'Globe', title: 'Header transforms', desc: 'Rewrite request & response headers at the edge.' },
              { icon: 'Layers', title: 'Response caching', desc: 'Cache GET responses via Workers Cache API.' },
              { icon: 'Activity', title: 'Canary splitting', desc: 'Deterministic IP-hash routing — same visitor, same shard.' },
              { icon: 'Shield', title: 'IP allow / deny', desc: 'CIDR, wildcards and exact IPs. Deny wins.' },
              { icon: 'Server', title: 'Mock routes', desc: 'Return canned JSON for unbuilt APIs.' },
              { icon: 'Zap', title: 'Rate limiting', desc: '3-layer ladder: memory → cache → binding.' },
              { icon: 'Link', title: 'Path routing', desc: 'Regex-free prefix matching to any upstream.' },
              { icon: 'Lock', title: 'CORS baked in', desc: 'Preflight handled before your origin sees it.' },
            ].map((f, i) => {
              const I = Icons[f.icon as keyof typeof Icons];
              return <div key={i} className="feature-card" style={{ padding: 18 }}><I size={16} stroke="var(--accent)" /><div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>{f.title}</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>{f.desc}</div></div>;
            })}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <a href="/features" className="btn btn-ghost btn-sm">Explore all features →</a>
            <a href="/testimonials" className="btn btn-ghost btn-sm">Read testimonials →</a>
          </div>
        </section>

        {/* Use Cases */}
        <section style={{
          position: 'relative', zIndex: 5,

          padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// use cases</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, marginBottom: 48 }}>
            Built for modern architectures
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 45vw, 340px), 1fr))',
            gap: 'clamp(16px, 3vw, 24px)',
          }}>
            {[
              { icon: 'Zap', title: 'API Gateway', desc: 'Route REST/GraphQL traffic across multiple backend services with weighted distribution and automatic failover.', features: ['Request-level routing', 'Health checks', 'Zero-downtime deploys'] },
              { icon: 'Globe', title: 'Multi-Region Apps', desc: 'Geo-steer users to the closest origin based on Cloudflare PoP location for optimal latency.', features: ['Continental routing', 'GDPR compliance', 'Edge-level decisions'] },
              { icon: 'Shield', title: 'High Availability', desc: 'Failover strategy ensures requests automatically retry healthy origins if primary fails or returns 5xx errors.', features: ['Ordered retry logic', 'Health monitoring', 'Zero config needed'] },
              { icon: 'Link', title: 'Stateful Workloads', desc: 'Cookie-sticky routing keeps users pinned to the same backend server for sessions, WebSockets, or shopping carts.', features: ['Session affinity', 'Persistent connections', 'No Redis needed'] },
              { icon: 'Layers', title: 'Microservices Mesh', desc: 'Deploy multiple load balancers for different services, each with its own routing strategy and origin set.', features: ['Service isolation', 'Independent scaling', 'Per-service metrics'] },
            ].map((useCase, i) => {
              const Ico = Icons[useCase.icon as keyof typeof Icons];
              return (
                <div key={i} className="feature-card feature-card-lift animate-on-scroll scale-in" style={{ padding: 'clamp(20px, 3vw, 24px)', animationDelay: `${i * 0.1}s` }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius)',
                    background: 'var(--accent-dim)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <Ico size={20} stroke="var(--accent)" />
                  </div>
                  <h3 style={{ fontSize: 'clamp(15px, 3vw, 17px)', margin: 0, fontWeight: 600, marginBottom: 8 }}>{useCase.title}</h3>
                  <p style={{ fontSize: 'clamp(13px, 2vw, 14px)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{useCase.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {useCase.features.map((feature, j) => (
                      <li key={j} style={{ fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Open source transparency */}
        <section style={{
          position: 'relative', zIndex: 5,

          padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// how it works under the hood</div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', margin: 0, letterSpacing: '-0.02em', fontWeight: 600 }}>
            You can see the code<span style={{ color: 'var(--accent)' }}>.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 12, maxWidth: 640, lineHeight: 1.6 }}>
            Every deployed Worker is visible in your Cloudflare dashboard. Generated from strategy-specific templates — no black box.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <a href="/developers" className="btn btn-ghost btn-sm">API docs →</a>
            <a href="/features" className="btn btn-ghost btn-sm">All features →</a>
          </div>
        </section>

        {/* Why Workers — solo dev pitch */}
        <section style={{
          position: 'relative', zIndex: 5,
 padding: '48px clamp(16px, 4vw, 48px)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48, alignItems: 'start' }} className="two-col">
            <div>
              <div className="kicker" style={{ marginBottom: 16 }}>// built for solo devs</div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, lineHeight: 1.05 }}>
                Free tier runs<br />a real website<span style={{ color: 'var(--accent)' }}>.</span>
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 20, lineHeight: 1.6, maxWidth: 420 }}>
                Cloudflare Workers give you <span className="mono" style={{ color: 'var(--accent)' }}>100k requests/day</span> for
                $0. Pay-as-you-go after that starts at <span className="mono" style={{ color: 'var(--accent)' }}>$5/mo</span>,
                with 10M requests and 30M CPU-ms included. No idle charges. No DevOps.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(12px, 2vw, 16px)' }}>
              {[
                { v: '5', l: 'free load balancers', s: 'All 7 strategies included.' },
                { v: '₹49', l: 'student plan / month', s: '10 LBs, analytics, health checks.' },
                { v: '₹299', l: 'pro plan / month', s: 'Unlimited LBs, AI, rate limiting.' },
                { v: '~0ms', l: 'cold start', s: 'Isolates, not containers.' },
              ].map((s, i) => (
                <div key={i} className="feature-card animate-on-scroll scale-in" style={{ padding: 24, animationDelay: `${i * 0.1}s` }}>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{s.v}</div>
                  <div className="kicker" style={{ marginTop: 8 }}>{s.l}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.625 }}>{s.s}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost comparison */}
        <section id="pricing" style={{
          position: 'relative', zIndex: 5,
 padding: '32px clamp(16px, 4vw, 48px) 96px',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// pricing</div>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', margin: 0, letterSpacing: '-0.02em', fontWeight: 600 }}>
            Simple pricing. No surprises.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 32, maxWidth: 640 }}>
            Start free, upgrade when you need more. All plans include 7 routing strategies and health checks.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'stretch' }} className="pricing-grid">
            {/* Free */}
            <div className="feature-card animate-on-scroll fade-in-up" style={{ padding: 24 }}>
              <div className="kicker">// free</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹0</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>forever</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Up to 5 load balancers', 'All 7 traffic strategies', 'Health Checks (up to 2 LBs)', 'Deployment history', 'Pause / resume'].map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--green)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Student */}
            <div className="feature-card animate-on-scroll fade-in-up" style={{ padding: 24, border: '2px solid #3b82f6', animationDelay: '0.1s' }}>
              <div className="kicker" style={{ color: '#3b82f6' }}>// student&apos;s support</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹49<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>30 days</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Up to 10 load balancers', 'All 7 traffic strategies', 'Health Checks (up to 5 LBs)', 'Analytics & script download', 'Custom Smart Placement'].map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#3b82f6' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
            {/* Pro */}
            <div className="feature-card animate-on-scroll fade-in-up" style={{ padding: 24, border: '1px solid var(--accent)', position: 'relative', animationDelay: '0.2s' }}>
              <div style={{ position: 'absolute', top: -1, right: 16, padding: '4px 10px', backgroundImage: 'linear-gradient(to right, var(--accent), var(--orange))', color: '#fff', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: '0 0 6px 6px', fontWeight: 600 }}>best value</div>
              <div className="kicker">// pro</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹299<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-3)' }}>/mo</span></div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>30 days</div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Unlimited load balancers', 'All 7 traffic strategies', 'Unlimited Health Checks', 'AI Agent', 'Rate Limiting', 'Analytics & script download'].map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="feature-card" style={{ marginTop: 24, padding: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Free trial available — <span style={{ color: 'var(--accent)' }}>no credit card required</span>.
            </div>
            <a href="/pro" className="btn btn-primary" style={{ fontSize: 13 }}>View all plans →</a>
          </div>
        </section>

        {/* Strategies Section */}
        <section id="strategies" style={{
          position: 'relative', zIndex: 5,
 padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// routing strategies</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, marginBottom: 16 }}>
            Seven ways to route traffic
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', color: 'var(--text-2)', maxWidth: 680, marginBottom: 48 }}>
            Each strategy is optimized for different use cases. Pick the one that fits your architecture,
            or switch strategies anytime without downtime.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 45vw, 360px), 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
            {[
              { id: 'round-robin', icon: 'Refresh', title: 'Round Robin', desc: 'One request each, taking turns', detail: 'Each request goes to the next server in line, then back to the first. Every server gets an equal share.', useCase: 'Ideal for: Stateless APIs, microservices, equal capacity backends' },
              { id: 'weighted-round-robin', icon: 'Activity', title: 'Weighted Round Robin', desc: 'Bigger servers get more traffic', detail: 'You give each server a number, and it gets that share of the traffic.', useCase: 'Ideal for: Mixed server capacities, gradual rollouts, A/B testing' },
              { id: 'ip-hash', icon: 'Key', title: 'IP Hash', desc: 'Same visitor, same server, every time', detail: "The visitor's IP address decides which server they get, so they always land on the same one.", useCase: 'Ideal for: CDN origin selection, cache warming, consistent routing' },
              { id: 'cookie-sticky', icon: 'Link', title: 'Sticky Sessions', desc: 'A visitor stays on one server', detail: 'The first request picks a server, and a cookie keeps that visitor there for the rest of their visit.', useCase: 'Ideal for: Session-based apps, shopping carts, WebSocket connections' },
              { id: 'weighted-cookie-sticky', icon: 'Layers', title: 'Weighted Sticky Sessions', desc: 'Bigger servers get more visitors, who then stay', detail: 'New visitors are shared out by server size, and a cookie then keeps each one on the server they were given.', useCase: 'Ideal for: Stateful apps with mixed capacity servers' },
              { id: 'failover', icon: 'Shield', title: 'Failover', desc: 'Main server first, backup when it breaks', detail: 'Everything goes to your main server. The moment it stops responding, the next server takes over automatically.', useCase: 'Ideal for: Primary/backup setups, disaster recovery, high availability' },
              { id: 'geo-steering', icon: 'Globe', title: 'Geographic Routing', desc: 'Visitors go to the nearest server', detail: 'Each visitor is sent to the server closest to them — matched by city, then country, then continent.', useCase: 'Ideal for: GDPR compliance, latency optimization, regional isolation' },
            ].map((strategy, i) => {
              const Ico = Icons[strategy.icon as keyof typeof Icons];
              return (
                <div key={strategy.id} className="feature-card feature-card-lift animate-on-scroll fade-in-up" style={{ padding: 'clamp(20px, 3vw, 28px)', animationDelay: `${i * 0.1}s` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', backgroundImage: 'linear-gradient(to bottom right, #f59e0b26, #fe6e0014)', border: '1px solid #f59e0b40', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Ico size={22} stroke="var(--accent)" />
                  </div>
                  <h3 style={{ fontSize: 'clamp(16px, 3vw, 18px)', margin: 0, letterSpacing: '-0.01em', fontWeight: 600, marginBottom: 8 }}>{strategy.title}</h3>
                  <div className="kicker" style={{ marginBottom: 12 }}>{strategy.desc}</div>
                  <p style={{ fontSize: 'clamp(13px, 2vw, 14px)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>{strategy.detail}</p>
                  <div style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 'clamp(11px, 2vw, 12px)', fontFamily: 'var(--mono)', color: 'var(--text-3)' }}>{strategy.useCase}</div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="/strategies" className="btn btn-ghost">View all strategies in detail →</a>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" style={{
          position: 'relative', zIndex: 5,
          maxWidth: 900, margin: '0 auto',
          padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// frequently asked</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, marginBottom: 48 }}>
            Questions &amp; Answers
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {FAQS.map((faq, i) => (
              <details key={i} className="feature-card animate-on-scroll fade-in" style={{ padding: 'clamp(16px, 3vw, 20px)', animationDelay: `${i * 0.05}s` }}>
                <summary style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: 600, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span>{faq.question}</span>
                  <Icons.ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 200ms' }} />
                </summary>
                <div style={{ fontSize: 'clamp(13px, 2vw, 14px)', color: 'var(--text-2)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', lineHeight: 1.6 }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <a href="/faq" className="btn btn-ghost">View all FAQs →</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
