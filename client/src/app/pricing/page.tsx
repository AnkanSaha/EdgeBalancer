import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { CTAButton } from '@/components/landing/CTAButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — EdgeBalancer',
  description: 'EdgeBalancer is free under 100k requests/day. Paid plans start at $5/month on Cloudflare Workers. No idle fees, no egress charges, no per-query costs. Compare with AWS ALB and Cloudflare Load Balancing.',
  alternates: { canonical: 'https://edge.nexoral.in/pricing' },
};

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// pricing</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Free tier runs<br />a real website<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            EdgeBalancer is free to use. You pay only for Cloudflare Worker requests.
            Under 100k requests/day, that&apos;s <span className="mono" style={{ color: 'var(--green)' }}>$0/month</span>.
            No credit card required to start.
          </p>
        </section>

        {/* Pricing cards */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 5vw, 64px)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 40vw, 380px), 1fr))', gap: 'clamp(16px, 3vw, 24px)' }}>
            {/* Free */}
            <div className="feature-card" style={{ padding: 'clamp(24px, 3vw, 32px)' }}>
              <div className="kicker">// free tier</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em' }}>$0</span>
                <span style={{ fontSize: 14, color: 'var(--text-3)' }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 24 }}>
                Cloudflare Workers free tier includes 100k requests/day. No credit card needed.
              </p>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>What you get</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    '100k requests/day (3M/month)',
                    '7 routing strategies',
                    'Health checks with auto-failover',
                    'Unlimited load balancers',
                    'AES-256-GCM encrypted credentials',
                    'OAuth connection to Cloudflare',
                    'Deployment history & rollback',
                    'Community support',
                  ].map((f, i) => (
                    <li key={i} style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Paid */}
            <div className="feature-card" style={{ padding: 'clamp(24px, 3vw, 32px)', border: '1px solid var(--accent)', boxShadow: '0 0 40px #f59e0b20', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: -1, right: 20,
                padding: '4px 12px', backgroundImage: 'linear-gradient(to right, var(--accent), var(--orange))',
                color: '#fff', fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.06em', borderRadius: '0 0 6px 6px', fontWeight: 600,
              }}>recommended</div>
              <div className="kicker">// workers paid</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 700, letterSpacing: '-0.03em' }}>$5</span>
                <span style={{ fontSize: 14, color: 'var(--text-3)' }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 24 }}>
                Cloudflare Workers Paid plan. Includes 10M requests + 30M CPU-ms. Scales automatically.
              </p>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Everything in free, plus</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    '10M requests/month included',
                    '30M CPU-ms included',
                    '$0.30 per million requests after',
                    '$0.02 per million CPU-ms after',
                    'Zero cold starts (V8 isolates)',
                    'No idle fees — scales to zero',
                    'No egress or cross-region fees',
                    'Priority email support',
                  ].map((f, i) => (
                    <li key={i} style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 5vw, 64px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// how does it compare</div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            EdgeBalancer vs. alternatives
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 15px)', color: 'var(--text-3)', marginBottom: 32, maxWidth: 720 }}>
            Modeled on a small API workload — ~1 LCU/hr steady traffic, 15M requests/month, 7ms avg CPU time.
          </p>

          <div className="feature-card" style={{ padding: 'clamp(16px, 3vw, 24px)', overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 'clamp(12px, 1.5vw, 14px)', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500, fontFamily: 'var(--mono)' }}>Feature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>EdgeBalancer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>AWS ALB</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>CF LB</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>Nginx</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Monthly cost (15M req)', '~$8', '~$22', '~$13+', 'Server cost'],
                  ['Free tier', '100k req/day', 'None after yr 1', 'None', 'Manual setup'],
                  ['Idle fee', '$0', 'Yes (hourly)', 'Per-query', 'Always-on'],
                  ['Deploy time', '90 seconds', '10-30 min', '5-15 min', 'Hours'],
                  ['Health checks', '✓', '✓', '✓', 'Manual'],
                  ['Geo-steering', '✓', 'Extra cost', 'Extra cost', 'Manual'],
                  ['Cookie sticky', '✓', '✗', '✗', 'Manual'],
                  ['Edge deployment', '✓ (330+ PoPs)', '✗ (regional)', '✓', '✗'],
                  ['Auto-scaling', '✓', '✓', '✓', 'Manual'],
                  ['Zero cold start', '✓', 'N/A', 'N/A', 'N/A'],
                ].map(([feature, eb, aws, cf, nginx], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-2)', fontWeight: 500 }}>{feature}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--green)', fontFamily: 'var(--mono)' }}>{eb}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{aws}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{cf}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{nginx}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cost breakdown */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 5vw, 64px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// cost breakdown</div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            What does it actually cost?
          </h2>
          <p style={{ fontSize: 'clamp(14px, 2vw, 15px)', color: 'var(--text-3)', marginBottom: 32, maxWidth: 720 }}>
            Real examples at different traffic levels. All prices are Cloudflare Workers pricing — EdgeBalancer adds $0.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 35vw, 320px), 1fr))', gap: 'clamp(16px, 2vw, 20px)' }}>
            {[
              { traffic: '10k req/day', monthly: '300k req/mo', cost: '$0', note: 'Free tier — no credit card needed', color: 'var(--green)' },
              { traffic: '100k req/day', monthly: '3M req/mo', cost: '$0', note: 'Free tier limit — still $0', color: 'var(--green)' },
              { traffic: '500k req/day', monthly: '15M req/mo', cost: '~$8', note: 'Workers Paid: $5 + $3 overage', color: 'var(--accent)' },
              { traffic: '1M req/day', monthly: '30M req/mo', cost: '~$11', note: 'Workers Paid: $5 + $6 overage', color: 'var(--accent)' },
              { traffic: '5M req/day', monthly: '150M req/mo', cost: '~$47', note: 'Workers Paid: $5 + $42 overage', color: 'var(--text)' },
            ].map((tier, i) => (
              <div key={i} className="feature-card" style={{ padding: 'clamp(16px, 2vw, 24px)' }}>
                <div style={{ fontSize: 'clamp(13px, 1.8vw, 15px)', fontWeight: 600, marginBottom: 4 }}>{tier.traffic}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)', marginBottom: 12 }}>{tier.monthly}</div>
                <div style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 700, color: tier.color, letterSpacing: '-0.02em' }}>{tier.cost}</div>
                <div style={{ fontSize: 'clamp(12px, 1.5vw, 13px)', color: 'var(--text-3)', marginTop: 8 }}>{tier.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(48px, 5vw, 64px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// pricing faq</div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 32 }}>
            Common pricing questions
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 45vw, 450px), 1fr))', gap: 16 }}>
            {[
              { q: 'Does EdgeBalancer charge anything?', a: 'No. EdgeBalancer is free to use. You only pay Cloudflare for Worker requests.' },
              { q: 'What happens if I exceed the free tier?', a: 'Cloudflare automatically bills $0.30 per million requests. There are no surprise charges — you can set spending limits in your Cloudflare dashboard.' },
              { q: 'Are there any hidden fees?', a: 'No. No egress fees, no cross-region transfer fees, no idle charges, no per-balancer fees. You pay only for Worker requests.' },
              { q: 'Can I set a spending limit?', a: 'Yes. Cloudflare lets you set a monthly spending limit in your account settings. If you hit the limit, Workers stop executing (your origins are not affected).' },
              { q: 'Do I need a credit card for the free tier?', a: 'No. Cloudflare Workers free tier requires no credit card. You get 100k requests/day (3M/month) for free.' },
              { q: 'What if I cancel Cloudflare Workers Paid?', a: 'Your load balancers continue running on the free tier (100k req/day). No data is lost. You can re-subscribe anytime.' },
            ].map((faq, i) => (
              <div key={i} className="feature-card" style={{ padding: 'clamp(16px, 2vw, 20px)' }}>
                <div style={{ fontSize: 'clamp(14px, 1.8vw, 15px)', fontWeight: 600, marginBottom: 8 }}>{faq.q}</div>
                <div style={{ fontSize: 'clamp(13px, 1.6vw, 14px)', color: 'var(--text-2)', lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
          textAlign: 'center',
        }}>
          <div className="feature-card" style={{ padding: 'clamp(32px, 5vw, 48px)' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600 }}>Start for free, scale when ready</h2>
            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--text-2)', marginTop: 12, marginBottom: 24, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Deploy your first load balancer in 90 seconds. No credit card required.
            </p>
            <CTAButton />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
