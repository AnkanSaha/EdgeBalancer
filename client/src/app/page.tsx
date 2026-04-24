'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';
import { FlowDiagram } from '@/components/landing/FlowDiagram';

export default function LandingPage() {
  const router = useRouter();

  // Scroll animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <div className="topo" />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 48px)', borderBottom: '1px solid var(--line)',
        flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)',
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="hide-sm" style={{ display: 'flex', gap: 'clamp(12px, 2vw, 20px)', marginRight: 'clamp(8px, 2vw, 16px)', fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-2)' }}>
            <a href="#strategies" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>Strategies</a>
            <a href="#pricing" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>Pricing</a>
            <a href="#faq" className="nav-link" style={{ transition: 'color 0.15s', cursor: 'pointer' }}>FAQ</a>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/login')} style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/register')} style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>
            Get started <Icons.Arrow size={14} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(40px, 5vw, 64px)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center',
      }} className="hero-grid">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 12px', border: '1px solid var(--line-2)',
            borderRadius: 999, background: 'var(--bg-1)',
            fontFamily: 'var(--mono)', fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-2)',
            marginBottom: 'clamp(16px, 3vw, 24px)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
            }} />
            A gateway for Cloudflare Workers
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 72px)', lineHeight: 0.98,
            letterSpacing: '-0.035em', fontWeight: 500, margin: 0,
          }}>
            Turn a Worker
            <br />
            into a <span style={{ color: 'var(--accent)' }}>load balancer.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 520,
            marginTop: 'clamp(16px, 3vw, 24px)', lineHeight: 1.5,
          }}>
            EdgeBalancer is a thin wrapper that converts your Cloudflare Worker into a
            production load balancer — 7 routing strategies, health checks, per-origin
            weights. No servers, no DevOps. Bring your API key and ship in 90 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 'clamp(24px, 4vw, 36px)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => router.push('/register')}>
              Start free <Icons.Arrow size={16} />
            </button>
          </div>
          <div style={{
            display: 'flex', gap: 'clamp(16px, 3vw, 32px)', marginTop: 'clamp(32px, 4vw, 48px)', flexWrap: 'wrap',
            fontFamily: 'var(--mono)', fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <div><span style={{ color: 'var(--accent)' }}>330+</span> PoPs</div>
            <div><span style={{ color: 'var(--accent)' }}>~14ms</span> p50 rtt</div>
            <div><span style={{ color: 'var(--accent)' }}>99.99%</span> uptime sla</div>
          </div>
        </div>

        <FlowDiagram />
      </section>

      {/* Feature strip */}
      <section style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto', padding: 'clamp(32px, 5vw, 48px) clamp(16px, 4vw, 48px) clamp(40px, 5vw, 64px)',
      }}>
        <div className="kicker" style={{ marginBottom: 'clamp(16px, 3vw, 24px)', fontSize: 'clamp(9px, 2vw, 11px)' }}>// How the gateway works</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 50vw, 240px), 1fr))',
          gap: 1, background: 'var(--line)', border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {[
            { icon: 'Key', title: '01 · Paste API token', desc: 'Scoped Workers + Zone edit token. Encrypted at rest.' },
            { icon: 'Zap', title: '02 · Pick a strategy', desc: 'Round robin, weighted, IP hash, sticky, failover, geo-steering.' },
            { icon: 'Globe', title: '03 · Deploy worker', desc: 'We compile + push a script to your account on 330+ PoPs.' },
            { icon: 'Activity', title: '04 · You own it', desc: "Traffic never touches us. Delete the token, it's gone." },
          ].map((f, i) => {
            const Ico = Icons[f.icon as keyof typeof Icons];
            return (
              <div key={i} style={{ background: 'var(--bg)', padding: 28 }}>
                <Ico size={20} stroke="var(--accent)" />
                <div style={{ fontSize: 15, fontWeight: 500, marginTop: 20, letterSpacing: '-0.01em' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto',
        padding: 'clamp(48px, 6vw, 80px) clamp(16px, 4vw, 48px)',
      }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// use cases</div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          margin: 0,
          letterSpacing: '-0.03em',
          fontWeight: 500,
          marginBottom: 48,
        }}>
          Built for modern architectures
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 45vw, 340px), 1fr))',
          gap: 'clamp(16px, 3vw, 24px)',
        }}>
          {[
            {
              icon: 'Zap',
              title: 'API Gateway',
              desc: 'Route REST/GraphQL traffic across multiple backend services with weighted distribution and automatic failover.',
              features: ['Request-level routing', 'Health checks', 'Zero-downtime deploys'],
            },
            {
              icon: 'Globe',
              title: 'Multi-Region Apps',
              desc: 'Geo-steer users to the closest origin based on Cloudflare PoP location for optimal latency.',
              features: ['Continental routing', 'GDPR compliance', 'Edge-level decisions'],
            },
            {
              icon: 'Shield',
              title: 'High Availability',
              desc: 'Failover strategy ensures requests automatically retry healthy origins if primary fails or returns 5xx errors.',
              features: ['Ordered retry logic', 'Health monitoring', 'Zero config needed'],
            },
            {
              icon: 'Activity',
              title: 'Blue/Green Deployments',
              desc: 'Use weighted strategies to gradually shift traffic from old to new infrastructure with fine-grained control.',
              features: ['Gradual rollouts', 'Instant rollback', 'A/B testing'],
            },
            {
              icon: 'Link',
              title: 'Stateful Workloads',
              desc: 'Cookie-sticky routing keeps users pinned to the same backend server for sessions, WebSockets, or shopping carts.',
              features: ['Session affinity', 'Persistent connections', 'No Redis needed'],
            },
            {
              icon: 'Layers',
              title: 'Microservices Mesh',
              desc: 'Deploy multiple load balancers for different services, each with its own routing strategy and origin set.',
              features: ['Service isolation', 'Independent scaling', 'Per-service metrics'],
            },
          ].map((useCase, i) => {
            const Ico = Icons[useCase.icon as keyof typeof Icons];
            return (
              <div
                key={i}
                className="card animate-on-scroll scale-in"
                style={{
                  padding: 'clamp(20px, 3vw, 24px)',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'var(--bg-2)', border: '1px solid var(--line-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Ico size={20} stroke="var(--accent)" />
                </div>
                <h3 style={{
                  fontSize: 'clamp(15px, 3vw, 17px)',
                  margin: 0,
                  fontWeight: 500,
                  marginBottom: 8,
                }}>
                  {useCase.title}
                </h3>
                <p style={{
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  {useCase.desc}
                </p>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {useCase.features.map((feature, j) => (
                    <li
                      key={j}
                      style={{
                        fontSize: 'clamp(12px, 2vw, 13px)',
                        color: 'var(--text-3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        flexShrink: 0,
                      }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Workers — solo dev pitch */}
      <section style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto', padding: '48px 48px 48px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48, alignItems: 'start' }} className="two-col">
          <div>
            <div className="kicker" style={{ marginBottom: 16 }}>// built for solo devs</div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 500, lineHeight: 1.05 }}>
              Free tier runs<br />a real website.<span style={{ color: 'var(--accent)' }}>.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 20, lineHeight: 1.6, maxWidth: 420 }}>
              Cloudflare Workers give you <span className="mono" style={{ color: 'var(--accent)' }}>100k requests/day</span> for
              $0. Pay-as-you-go after that starts at <span className="mono" style={{ color: 'var(--accent)' }}>$5/mo</span>,
              with 10M requests and 30M CPU-ms included. No idle charges. No DevOps.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {[
              { v: '100k', l: 'free requests / day', s: 'No credit card. Real production traffic.' },
              { v: '$5', l: 'paid plan / month', s: 'Includes 10M req + 30M CPU-ms.' },
              { v: '$0.30', l: 'per million req', s: 'Beyond the included pool.' },
              { v: '~0ms', l: 'cold start', s: 'Isolates, not containers.' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-1)', padding: 24 }}>
                <div className="mono" style={{ fontSize: 30, letterSpacing: '-0.02em', color: 'var(--accent)' }}>{s.v}</div>
                <div className="kicker" style={{ marginTop: 8 }}>{s.l}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost comparison */}
      <section id="pricing" style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto', padding: '32px 48px 96px',
      }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// the math</div>
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 36px)', margin: 0, letterSpacing: '-0.02em', fontWeight: 500 }}>
          AWS ALB vs. Cloudflare Workers
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 32, maxWidth: 640 }}>
          Modeled on a small API — ~1 LCU/hr steady traffic, 15M requests/mo, 7ms avg CPU.
          Figures from <span className="mono">aws.amazon.com/elasticloadbalancing/pricing</span> and <span className="mono">developers.cloudflare.com/workers/platform/pricing</span>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 16, alignItems: 'stretch' }} className="cmp-grid">
          {/* AWS */}
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div className="kicker">// option a</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 6 }}>AWS Application Load Balancer</div>
              </div>
              <span className="chip mono" style={{ color: 'var(--text-3)' }}>hourly + LCU</span>
            </div>

            <table style={{ width: '100%', fontSize: 13, fontFamily: 'var(--mono)', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Base hourly</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>$0.0225 × 730h</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text)' }}>$16.43</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>LCU usage</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>1 × $0.008 × 730h</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text)' }}>$5.84</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Idle fee (always-on)</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>yes</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--red)' }}>charged</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Free tier after yr 1</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>none</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--red)' }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 0 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)' }}>Est. monthly</td>
                  <td></td>
                  <td style={{ padding: '16px 0 0', textAlign: 'right', fontSize: 22, color: 'var(--red)', letterSpacing: '-0.02em' }}>
                    ~$22.27
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5 }}>
              Before EC2 target costs, data egress, or cross-AZ transfer. Spiky traffic multiplies LCU charges.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }} className="vs-col">
            vs
          </div>

          {/* Cloudflare via EdgeBalancer */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)', padding: 24, position: 'relative',
            boxShadow: '0 0 0 1px var(--accent-dim)',
          }}>
            <div style={{
              position: 'absolute', top: -1, right: 16,
              padding: '4px 10px', background: 'var(--accent)', color: 'oklch(0.18 0.02 60)',
              fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.06em', borderRadius: '0 0 6px 6px', fontWeight: 600,
            }}>
              recommended
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div className="kicker">// option b</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 6 }}>
                  Cloudflare Workers via EdgeBalancer
                </div>
              </div>
              <span className="chip mono" style={{ color: 'var(--accent)' }}>request-based</span>
            </div>

            <table style={{ width: '100%', fontSize: 13, fontFamily: 'var(--mono)', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Subscription</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>Workers Paid</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text)' }}>$5.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Requests</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>5M × $0.30/M</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text)' }}>$1.50</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>CPU time</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>75M-ms × $0.02/M</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--text)' }}>$1.50</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--text-3)' }}>Idle fee</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>never</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: 'var(--green)' }}>$0.00</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 0 0', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-3)' }}>Est. monthly</td>
                  <td></td>
                  <td style={{ padding: '16px 0 0', textAlign: 'right', fontSize: 22, color: 'var(--green)', letterSpacing: '-0.02em' }}>
                    ~$8.00
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 16, lineHeight: 1.5 }}>
              Zero dollars under the free plan's 100k req/day. No egress fees. No cross-region transfer.
              Scales to zero automatically.
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 24, padding: 20,
          border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-1)',
          display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Savings for this workload: <span style={{ color: 'var(--accent)' }}>~64%</span> — and under 100k req/day,{' '}
            <span style={{ color: 'var(--green)' }}>$0/month</span>.
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/register')}>
            Deploy your first balancer <Icons.Arrow size={14} />
          </button>
        </div>
      </section>

      {/* Strategies Section */}
      <section id="strategies" style={{
        position: 'relative', zIndex: 5,
        maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px)',
      }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// routing strategies</div>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 500, marginBottom: 16 }}>
          Seven ways to route traffic
        </h2>
        <p style={{ fontSize: 'clamp(14px, 2.5vw, 16px)', color: 'var(--text-2)', maxWidth: 680, marginBottom: 48 }}>
          Each strategy is optimized for different use cases. Pick the one that fits your architecture,
          or switch strategies anytime without downtime.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 45vw, 360px), 1fr))',
          gap: 'clamp(16px, 3vw, 24px)',
        }}>
          {[
            {
              id: 'round-robin',
              icon: 'Refresh',
              title: 'Round Robin',
              desc: 'Edge-local rotating cursor',
              detail: 'Distributes requests evenly across all origins using a rotating counter maintained at each edge location. Simple, fair, and predictable.',
              useCase: 'Ideal for: Stateless APIs, microservices, equal capacity backends',
            },
            {
              id: 'weighted-round-robin',
              icon: 'Activity',
              title: 'Weighted Round Robin',
              desc: 'Weighted random selection',
              detail: 'Assigns requests based on origin weights. A server with weight 40 receives roughly 40% of traffic. Uses weighted random selection for best distribution.',
              useCase: 'Ideal for: Mixed server capacities, gradual rollouts, A/B testing',
            },
            {
              id: 'ip-hash',
              icon: 'Key',
              title: 'IP Hash',
              desc: 'Stable origin selection from cf-connecting-ip',
              detail: 'Routes clients to the same origin based on their IP address hash. Ensures consistent routing for the same client without cookies.',
              useCase: 'Ideal for: CDN origin selection, cache warming, consistent routing',
            },
            {
              id: 'cookie-sticky',
              icon: 'Link',
              title: 'Cookie Sticky',
              desc: 'First assignment, then affinity by cookie',
              detail: 'First request is routed randomly, then a cookie pins the client to that origin. Subsequent requests from the same client always hit the same backend.',
              useCase: 'Ideal for: Session-based apps, shopping carts, WebSocket connections',
            },
            {
              id: 'weighted-cookie-sticky',
              icon: 'Layers',
              title: 'Weighted Sticky',
              desc: 'Weighted first assignment, then affinity',
              detail: 'Combines weights and sticky sessions. First request uses weighted random selection, then cookie affinity maintains the assignment.',
              useCase: 'Ideal for: Stateful apps with mixed capacity servers, gradual migrations',
            },
            {
              id: 'failover',
              icon: 'Shield',
              title: 'Failover',
              desc: 'Ordered upstream retry on failure or 5xx',
              detail: 'Tries origins in order. If an origin fails or returns a 5xx error, automatically retries the next origin in the list until success.',
              useCase: 'Ideal for: Primary/backup setups, disaster recovery, high availability',
            },
            {
              id: 'geo-steering',
              icon: 'Globe',
              title: 'Geo Steering',
              desc: 'Match by colo, country, continent, then fallback',
              detail: 'Routes based on Cloudflare edge location metadata. Matches by specific colo first, then country, then continent, with fallback rotation.',
              useCase: 'Ideal for: GDPR compliance, latency optimization, regional isolation',
            },
          ].map((strategy, i) => {
            const Ico = Icons[strategy.icon as keyof typeof Icons];
            return (
              <div
                key={strategy.id}
                className="card animate-on-scroll fade-in-up"
                style={{
                  padding: 'clamp(20px, 3vw, 28px)',
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius)',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Ico size={22} stroke="var(--accent)" />
                </div>
                <h3 style={{
                  fontSize: 'clamp(16px, 3vw, 18px)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                  fontWeight: 500,
                  marginBottom: 8,
                }}>
                  {strategy.title}
                </h3>
                <div className="kicker" style={{ marginBottom: 12 }}>
                  {strategy.desc}
                </div>
                <p style={{
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}>
                  {strategy.detail}
                </p>
                <div style={{
                  padding: 12,
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  fontSize: 'clamp(11px, 2vw, 12px)',
                  fontFamily: 'var(--mono)',
                  color: 'var(--text-3)',
                }}>
                  {strategy.useCase}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{
        position: 'relative', zIndex: 5,
        maxWidth: 900, margin: '0 auto',
        padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
      }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// frequently asked</div>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 44px)',
          margin: 0,
          letterSpacing: '-0.03em',
          fontWeight: 500,
          marginBottom: 48,
        }}>
          Questions &amp; Answers
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            {
              q: 'How is this different from Cloudflare Load Balancing?',
              a: 'Cloudflare Load Balancing is a DNS-based solution ($5/balancer + per-query fees). EdgeBalancer deploys as a Worker script, giving you request-level control with no per-query costs. You pay only for Worker requests (100k/day free, then $0.30/M).',
            },
            {
              q: 'Can I bring my own domains?',
              a: 'Yes. You connect your Cloudflare account, and we deploy Workers to zones you already own. You maintain full control — delete the API token and the Workers stay deployed under your account.',
            },
            {
              q: 'What happens if EdgeBalancer goes down?',
              a: "Your load balancers keep running. Once deployed, the Worker script lives in your Cloudflare account. EdgeBalancer is only the control plane for creating and updating configs — the data plane runs independently on Cloudflare's edge.",
            },
            {
              q: 'How do updates work?',
              a: 'Updates use Cloudflare Worker Versions and Deployments. When you change a config, we create a new version, deploy it, and keep the previous version as a rollback target. Old inactive versions are pruned automatically.',
            },
            {
              q: 'Can I see the generated Worker code?',
              a: "Yes. All Worker scripts are visible in your Cloudflare dashboard under Workers & Pages. The code is generated from strategy-specific templates in EdgeBalancer's open-source repository.",
            },
            {
              q: 'What are the performance implications?',
              a: 'Workers add ~1-3ms median overhead. The benefit is intelligent routing, health checks, and failover at the edge — much faster than round-tripping to a centralized load balancer. For most use cases, latency decreases overall.',
            },
            {
              q: 'Do you store or proxy my traffic?',
              a: 'No. EdgeBalancer never sees your production traffic. We store only metadata (origin URLs, weights, strategy choice) encrypted in MongoDB. All requests flow directly from Cloudflare edge → your origins.',
            },
            {
              q: 'How do I delete everything?',
              a: "Delete load balancers from the dashboard, then rotate your API token. You can also manually delete the Worker scripts from Cloudflare's dashboard. EdgeBalancer has no lock-in — everything runs in your account.",
            },
          ].map((faq, i) => (
            <details
              key={i}
              className="animate-on-scroll fade-in"
              style={{
                padding: 'clamp(16px, 3vw, 20px)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                background: 'var(--bg-1)',
                cursor: 'pointer',
                transition: 'all 200ms',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <summary style={{
                fontSize: 'clamp(14px, 2.5vw, 16px)',
                fontWeight: 500,
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}>
                <span>{faq.q}</span>
                <Icons.ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 200ms' }} />
              </summary>
              <div style={{
                fontSize: 'clamp(13px, 2vw, 14px)',
                color: 'var(--text-2)',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
                lineHeight: 1.6,
              }}>
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        <div style={{
          marginTop: 48,
          padding: 'clamp(24px, 4vw, 32px)',
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 'clamp(18px, 3vw, 20px)', margin: 0, marginBottom: 12 }}>
            Still have questions?
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: 20 }}>
            Check the documentation or reach out to the team.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost">
              <Icons.Book size={14} /> Documentation
            </button>
            <button className="btn btn-dark">
              <Icons.Mail size={14} /> Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--line)',
        padding: '24px 48px',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div>© 2026 EdgeBalancer Inc.</div>
        <div style={{ display: 'flex', gap: 24 }} className="hide-sm">
          <span>Status: <span style={{ color: 'var(--green)' }}>● operational</span></span>
          <span>SOC2 Type II</span>
          <span>Terms</span>
          <span>Privacy</span>
        </div>
      </footer>
    </div>
  );
}
