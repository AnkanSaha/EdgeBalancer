'use client';

import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { Icons } from '@/components/shared/Icons';
import { FlowDiagram } from '@/components/landing/FlowDiagram';

export default function LandingPage() {
  const router = useRouter();

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
        display: 'grid', gridTemplateColumns: '1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center',
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

      <style jsx>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; padding: 48px 24px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .cmp-grid { grid-template-columns: 1fr !important; }
          .vs-col { display: none !important; }
          nav { padding: 16px 24px !important; }
          footer { padding: 16px 24px !important; }
        }
      `}</style>
    </div>
  );
}
