import { Icons } from '@/components/shared/Icons';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { ScrollAnimator } from '@/components/landing/ScrollAnimator';
import { CTAButton } from '@/components/landing/CTAButton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Routing Strategies — EdgeBalancer',
  description: 'EdgeBalancer offers 7 load balancing strategies for Cloudflare Workers: round robin, weighted round robin, IP hash, sticky sessions, weighted sticky, failover, and geo-steering. Choose the right strategy for your architecture.',
  alternates: { canonical: 'https://edge.nexoral.in/strategies' },
  openGraph: {
    title: 'Routing Strategies — EdgeBalancer',
    description: '7 load balancing strategies for Cloudflare Workers. Choose the right one for your architecture.',
  },
};

const STRATEGIES = [
  {
    id: 'round-robin',
    icon: 'Refresh',
    title: 'Round Robin',
    subtitle: 'Equal distribution, zero configuration',
    desc: 'The simplest load balancing strategy. Each incoming request is sent to the next origin server in the list, cycling through all servers in order. Every server gets an equal share of traffic regardless of its capacity or current load.',
    how: 'The Worker maintains an internal counter. Request 1 goes to Origin A, Request 2 to Origin B, Request 3 to Origin C, Request 4 back to Origin A, and so on. The counter is edge-local, meaning each Cloudflare data center tracks its own rotation independently.',
    when: ['Your origins have identical capacity and specs', 'You are serving stateless APIs or static content', 'You want the simplest possible setup', 'All origins are in the same region'],
    whenNot: ['Origins have different CPU/memory capacity', 'Some origins are slower than others', 'You need session persistence'],
    technical: { overhead: '~0ms', complexity: 'Low', failover: 'No', sticky: 'No' },
  },
  {
    id: 'weighted-round-robin',
    icon: 'Activity',
    title: 'Weighted Round Robin',
    subtitle: 'Proportional traffic based on server capacity',
    desc: 'Like round robin, but each server is assigned a weight that determines what percentage of traffic it receives. A server with weight 70 gets roughly 70% of all requests, while a server with weight 30 gets 30%. This lets you match traffic distribution to your actual server capacity.',
    how: 'You assign a numeric weight to each origin (e.g., 60, 30, 10). The Worker uses weighted random selection to pick an origin for each request. Over time, the distribution converges to match the weights. The selection is per-request, not a fixed rotation.',
    when: ['Your origins have different capacities (e.g., 8GB vs 2GB RAM)', 'You are doing gradual rollouts (new server gets 10% traffic)', 'You are A/B testing between two backends', 'You have a mix of dedicated and shared hosting'],
    whenNot: ['All origins are identical (use round robin)', 'You need guaranteed exact percentages (weighted is probabilistic)'],
    technical: { overhead: '~0ms', complexity: 'Low', failover: 'No', sticky: 'No' },
  },
  {
    id: 'ip-hash',
    icon: 'Key',
    title: 'IP Hash',
    subtitle: 'Consistent routing without cookies',
    desc: 'The visitor\'s IP address is hashed to determine which origin server they hit. The same IP always maps to the same server, providing consistency without requiring cookies. This works with any HTTP client, including browsers, mobile apps, and API consumers.',
    how: 'The Worker takes the client\'s IP address (from CF-Connecting-IP), hashes it, and maps the result to an origin index. The mapping is deterministic — the same IP always gets the same server. If an origin goes down, affected users are redistributed to the next available server.',
    when: ['You need consistent routing without cookies', 'You are running a CDN with cache warming at origins', 'Your API consumers expect to hit the same backend', 'You cannot use cookies (some API clients strip them)'],
    whenNot: ['Many users share the same IP (corporate NAT, VPNs)', 'You need even distribution regardless of IP patterns'],
    technical: { overhead: '~0ms', complexity: 'Low', failover: 'No', sticky: 'Yes (by IP)' },
  },
  {
    id: 'cookie-sticky',
    icon: 'Link',
    title: 'Sticky Sessions',
    subtitle: 'Session persistence via cookies',
    desc: 'The first request from a visitor picks an origin server, and a cookie is set to keep that visitor pinned to the same server for the duration of their session. This ensures that session state, shopping carts, WebSocket connections, and in-progress work are never lost mid-session.',
    how: 'On the first request, the Worker selects an origin (round robin) and sets a cookie (eb_lb) with the origin index. On subsequent requests, the Worker reads the cookie and routes to the same origin. If the pinned origin is down, the Worker picks a new one and updates the cookie.',
    when: ['You have session-based applications (login sessions, shopping carts)', 'You use WebSocket connections that need to stay on one server', 'You have in-memory state that cannot be shared across origins', 'You are running traditional server-rendered apps (PHP, Rails, Django)'],
    whenNot: ['Your application is fully stateless', 'You want even distribution regardless of sessions', 'Cookie-based routing conflicts with your CDN caching'],
    technical: { overhead: '~1ms', complexity: 'Medium', failover: 'Yes (re-picks)', sticky: 'Yes (by cookie)' },
  },
  {
    id: 'weighted-cookie-sticky',
    icon: 'Layers',
    title: 'Weighted Sticky Sessions',
    subtitle: 'Capacity-aware distribution with session persistence',
    desc: 'Combines weighted distribution with cookie-based session persistence. New visitors are distributed across origins based on their weights, and then a cookie keeps each visitor pinned. This gives you capacity-aware load balancing for stateful applications.',
    how: 'On the first request, the Worker uses weighted random selection (like Weighted Round Robin) to pick an origin, then sets a cookie. All subsequent requests from that visitor go to the same origin via the cookie. New visitors are distributed proportionally to weights.',
    when: ['You have stateful applications with servers of different capacity', 'You are migrating to a larger server and need gradual traffic shift', 'You run shopping carts or sessions on mixed hardware'],
    whenNot: ['Your application is stateless (use weighted round robin)', 'All servers have equal capacity (use sticky sessions)'],
    technical: { overhead: '~1ms', complexity: 'Medium', failover: 'Yes (re-picks)', sticky: 'Yes (by cookie)' },
  },
  {
    id: 'failover',
    icon: 'Shield',
    title: 'Failover',
    subtitle: 'Primary-backup with automatic recovery',
    desc: 'All traffic goes to your primary origin server. The moment it stops responding (connection failure, 5xx error, or timeout), the Worker automatically routes to the next server in the list. When the primary recovers, traffic shifts back. This gives you disaster recovery with zero manual intervention.',
    how: 'The Worker tries the first origin. If it fails (5xx status, connection refused, or timeout), it retries the next origin in the list. Health checks run periodically in the background, and the Worker tracks which origins are healthy. Failed origins are marked as unhealthy and skipped for subsequent requests until they recover.',
    when: ['You have a primary server with a hot standby', 'You need disaster recovery without DNS-level failover', 'You want automatic failback when the primary recovers', 'You have a staging server that should only receive traffic when production is down'],
    whenNot: ['You want traffic distributed across all origins', 'All origins should actively serve traffic'],
    technical: { overhead: '~2ms (on failover)', complexity: 'Medium', failover: 'Yes (automatic)', sticky: 'No' },
  },
  {
    id: 'geo-steering',
    icon: 'Globe',
    title: 'Geographic Routing',
    subtitle: 'Location-aware traffic distribution',
    desc: 'Routes visitors to the origin server closest to their physical location. The Worker uses Cloudflare\'s edge data (data center colo, country, continent) to make routing decisions. This minimizes latency and helps with data sovereignty requirements like GDPR.',
    how: 'When a request arrives at a Cloudflare edge, the Worker checks the data center location. It first tries to match by city, then by country, then by continent. If no match is found, it falls back to round-robin across all origins. You configure which origins serve which regions.',
    when: ['You have origins in multiple regions (US, EU, Asia)', 'You need to comply with GDPR or data residency laws', 'You want to minimize latency for global users', 'You serve region-specific content (localized APIs, CDNs)'],
    whenNot: ['All origins are in the same region', 'You do not care about latency optimization', 'Your application does not have region-specific data'],
    technical: { overhead: '~1ms', complexity: 'High', failover: 'Yes (fallback)', sticky: 'No' },
  },
];

export default function StrategiesPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <ScrollAnimator />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// routing strategies</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Seven ways to<br />route traffic<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            Each strategy is optimized for different use cases. Pick the one that fits your architecture,
            or switch strategies anytime without downtime. All strategies run at the edge with zero cold starts.
          </p>
        </section>

        {/* Quick comparison */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
        }}>
          <div className="feature-card" style={{ padding: 'clamp(16px, 3vw, 24px)', overflowX: 'auto' }}>
            <div className="kicker" style={{ marginBottom: 16 }}>// quick comparison</div>
            <table style={{ width: '100%', fontSize: 'clamp(11px, 1.5vw, 13px)', fontFamily: 'var(--mono)', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500 }}>Strategy</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 500 }}>Overhead</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 500 }}>Failover</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-3)', fontWeight: 500 }}>Sticky</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 500 }}>Best For</th>
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 12px' }}><a href={`#${s.id}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.title}</a></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-2)' }}>{s.technical.overhead}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: s.technical.failover.startsWith('Yes') ? 'var(--green)' : 'var(--text-3)' }}>{s.technical.failover}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: s.technical.sticky.startsWith('Yes') ? 'var(--accent)' : 'var(--text-3)' }}>{s.technical.sticky}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{s.when[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detailed strategies */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 3vw, 32px)',
        }}>
          {STRATEGIES.map((strategy, i) => {
            const Ico = Icons[strategy.icon as keyof typeof Icons];
            return (
              <article
                key={strategy.id}
                id={strategy.id}
                className="feature-card animate-on-scroll fade-in-up"
                style={{ padding: 'clamp(24px, 4vw, 40px)', animationDelay: `${i * 0.05}s` }}
              >
                <div style={{ display: 'flex', gap: 'clamp(16px, 3vw, 24px)', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                    backgroundImage: 'linear-gradient(to bottom right, #f59e0b26, #fe6e0014)',
                    border: '1px solid #f59e0b40',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Ico size={26} stroke="var(--accent)" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 'clamp(22px, 3vw, 28px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}>{strategy.title}</h2>
                    <div className="kicker" style={{ marginTop: 6 }}>{strategy.subtitle}</div>
                  </div>
                </div>

                <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 24 }}>
                  {strategy.desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 400px), 1fr))', gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 20, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                    <div className="kicker" style={{ marginBottom: 12 }}>How it works</div>
                    <p style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 }}>{strategy.how}</p>
                  </div>
                  <div style={{ padding: 20, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                    <div className="kicker" style={{ marginBottom: 12 }}>Technical details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overhead</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{strategy.technical.overhead}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complexity</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{strategy.technical.complexity}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Failover</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: strategy.technical.failover.startsWith('Yes') ? 'var(--green)' : 'var(--text-3)' }}>{strategy.technical.failover}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sticky</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: strategy.technical.sticky.startsWith('Yes') ? 'var(--accent)' : 'var(--text-3)' }}>{strategy.technical.sticky}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 400px), 1fr))', gap: 16 }}>
                  <div style={{ padding: 20, background: 'var(--bg)', border: '1px solid var(--green)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Use when</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {strategy.when.map((item, j) => (
                        <li key={j} style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--green)', flexShrink: 0 }}>✓</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ padding: 20, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Do not use when</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {strategy.whenNot.map((item, j) => (
                        <li key={j} style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-3)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>✗</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* CTA */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
        }}>
          <div className="feature-card" style={{ padding: 'clamp(32px, 5vw, 48px)' }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', margin: 0, fontWeight: 600 }}>Ready to deploy?</h2>
            <p style={{ fontSize: 'clamp(14px, 2vw, 16px)', color: 'var(--text-2)', marginTop: 12, marginBottom: 24 }}>
              Pick a strategy and deploy your first load balancer in under 90 seconds.
            </p>
            <CTAButton />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
