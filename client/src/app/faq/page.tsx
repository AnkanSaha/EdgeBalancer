import { Icons } from '@/components/shared/Icons';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { FAQPageSchema } from '@/components/shared/JsonLd';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — EdgeBalancer',
  description: 'Frequently asked questions about EdgeBalancer — the Cloudflare Worker load balancer. Pricing, security, deployment, technical details, and more.',
  alternates: { canonical: 'https://edge.nexoral.in/faq' },
};

const FAQ_CATEGORIES = [
  {
    category: 'Getting Started',
    icon: 'Zap',
    faqs: [
      { q: 'How do I get started with EdgeBalancer?', a: 'Sign in with Google, connect your Cloudflare account (OAuth or API token), and click "Create Load Balancer." Pick a strategy, add your origin servers, and deploy. The whole process takes about 90 seconds.' },
      { q: 'What Cloudflare permissions do I need?', a: 'Workers Scripts: Edit (deploy and manage Workers), Zone: Read (list your domains), DNS: Edit (create records for IP-based origins), Account Analytics: Read (show request metrics), Workers Routes: Read (detect hostname conflicts, optional but recommended).' },
      { q: 'Can I connect via OAuth instead of API token?', a: 'Yes. OAuth is the recommended method. Click "Connect with Cloudflare" and you will be redirected to Cloudflare to authorize EdgeBalancer. No need to manually create tokens or copy IDs.' },
      { q: 'Do I need my own domain?', a: 'Yes. You need a domain on Cloudflare. EdgeBalancer deploys Workers to your Cloudflare zones, so you must own the domain you want to load-balance.' },
    ],
  },
  {
    category: 'How It Works',
    icon: 'Refresh',
    faqs: [
      { q: 'How is this different from Cloudflare Load Balancing?', a: 'Cloudflare Load Balancing is a DNS-based solution ($5/balancer + per-query fees). EdgeBalancer deploys as a Worker script, giving you request-level control with no per-query costs. You pay only for Worker requests (100k/day free, then $0.30/M).' },
      { q: 'What happens if EdgeBalancer goes down?', a: "Your load balancers keep running. Once deployed, the Worker script lives in your Cloudflare account. EdgeBalancer is only the control plane for creating and updating configs — the data plane runs independently on Cloudflare's edge." },
      { q: 'How do updates work?', a: 'Updates use Cloudflare Worker Versions and Deployments. When you change a config, we create a new version, deploy it, and keep the previous version as a rollback target. Old inactive versions are pruned automatically.' },
      { q: 'Can I see the generated Worker code?', a: "Yes. All Worker scripts are visible in your Cloudflare dashboard under Workers & Pages. The code is generated from strategy-specific templates." },
      { q: 'What are the performance implications?', a: 'Workers add ~1-3ms median overhead. The benefit is intelligent routing, health checks, and failover at the edge — much faster than round-tripping to a centralized load balancer.' },
      { q: 'Do you store or proxy my traffic?', a: 'No. EdgeBalancer never sees your production traffic. We store only metadata (origin URLs, weights, strategy choice) encrypted in MongoDB. All requests flow directly from Cloudflare edge to your origins.' },
    ],
  },
  {
    category: 'Security & Privacy',
    icon: 'Shield',
    faqs: [
      { q: 'Is my API token secure?', a: 'Yes. Your token is encrypted with AES-256-GCM before storage in MongoDB. The encryption key is stored separately from the database. We never log or store plaintext credentials.' },
      { q: 'What data do you collect?', a: 'We collect your account info (name, email), Cloudflare credentials (encrypted), and load balancer configuration. We do not collect or see your production traffic.' },
      { q: 'Can I revoke access?', a: 'Yes. Delete your load balancers from the dashboard, then disconnect your Cloudflare credentials (OAuth or API token). You can also revoke access directly from your Cloudflare dashboard.' },
      { q: 'Do you comply with GDPR/DPDP?', a: 'Yes. We comply with GDPR (EU) and DPDP Act 2023 (India). You can request data access, correction, or deletion at any time. See our Privacy Policy for details.' },
    ],
  },
  {
    category: 'Pricing & Billing',
    icon: 'Activity',
    faqs: [
      { q: 'Does EdgeBalancer charge anything?', a: 'No. EdgeBalancer is free to use. You only pay Cloudflare for Worker requests.' },
      { q: 'What happens if I exceed the free tier?', a: 'Cloudflare automatically bills $0.30 per million requests. You can set spending limits in your Cloudflare dashboard.' },
      { q: 'Are there any hidden fees?', a: 'No. No egress fees, no cross-region transfer, no idle charges, no per-balancer fees. You pay only for Worker requests.' },
    ],
  },
  {
    category: 'Technical',
    icon: 'Key',
    faqs: [
      { q: 'What routing strategies are available?', a: 'Round Robin, Weighted Round Robin, IP Hash, Sticky Sessions, Weighted Sticky Sessions, Failover, and Geographic Routing. See the Strategies page for detailed explanations.' },
      { q: 'How do health checks work?', a: 'EdgeBalancer runs periodic health checks to your origin servers. If an origin fails (5xx error, timeout, or connection refused), it is marked unhealthy and removed from rotation. When it recovers, it is added back.' },
      { q: 'Can I use WebSockets?', a: 'Yes. The sticky session strategies (cookie-sticky, weighted-cookie-sticky) work with WebSocket connections. The cookie keeps the connection pinned to the same origin.' },
      { q: 'How do I delete everything?', a: "Delete load balancers from the dashboard, then rotate your API token. You can also manually delete the Worker scripts from Cloudflare's dashboard. EdgeBalancer has no lock-in — everything runs in your account." },
    ],
  },
];

export default function FAQPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <FAQPageSchema faqs={FAQ_CATEGORIES.flatMap(c => c.faqs.map(f => ({ question: f.q, answer: f.a })))} />
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// frequently asked</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Questions &amp; Answers<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            Everything you need to know about EdgeBalancer. Can&apos;t find an answer?{' '}
            <a href="mailto:connect@ankan.in" style={{ color: 'var(--accent)' }}>Email us</a> or{' '}
            <a href="/contact" style={{ color: 'var(--accent)' }}>visit the contact page</a>.
          </p>
        </section>

        {/* FAQ by category */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
          display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 4vw, 48px)',
        }}>
          {FAQ_CATEGORIES.map((cat, ci) => {
            const Ico = Icons[cat.icon as keyof typeof Icons];
            return (
              <div key={ci}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius)',
                    backgroundImage: 'linear-gradient(to bottom right, #f59e0b26, #fe6e0014)',
                    border: '1px solid #f59e0b40',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Ico size={18} stroke="var(--accent)" />
                  </div>
                  <h2 style={{ fontSize: 'clamp(20px, 2.5vw, 24px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>{cat.category}</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 45vw, 450px), 1fr))', gap: 12 }}>
                  {cat.faqs.map((faq, fi) => (
                    <details key={fi} className="feature-card" style={{ padding: 'clamp(16px, 2vw, 20px)' }}>
                      <summary style={{ fontSize: 'clamp(14px, 1.8vw, 15px)', fontWeight: 600, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer', lineHeight: 1.4 }}>
                        <span>{faq.q}</span>
                        <Icons.ChevronDown size={16} style={{ flexShrink: 0, transition: 'transform 200ms', marginTop: 2 }} />
                      </summary>
                      <div style={{ fontSize: 'clamp(13px, 1.6vw, 14px)', color: 'var(--text-2)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Contact CTA */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
          textAlign: 'center',
        }}>
          <div className="feature-card" style={{ padding: 'clamp(32px, 5vw, 48px)' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600 }}>Still have questions?</h2>
            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--text-2)', marginTop: 12, marginBottom: 24 }}>
              We&apos;re happy to help. Reach out and we&apos;ll get back to you.
            </p>
            <a href="mailto:connect@ankan.in" className="btn btn-primary">Contact us</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
