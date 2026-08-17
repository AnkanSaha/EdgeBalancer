import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { blogPosts, BLOG_CATEGORIES } from '@/lib/blogData';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — EdgeBalancer',
  description: 'Guides, tutorials, and comparisons about Cloudflare Workers load balancing. Learn about routing strategies, health checks, failover, geo-steering, and cost optimization.',
  alternates: { canonical: 'https://edge.nexoral.in/blog' },
};

export default function BlogPage() {
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
          <div className="kicker" style={{ marginBottom: 12 }}>// blog</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Guides &amp; tutorials<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            Everything about Cloudflare Workers load balancing — from getting started to advanced routing strategies, cost optimization, and production best practices.
          </p>
        </section>

        {/* Category filters */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(32px, 4vw, 48px)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <span className="chip" style={{ background: 'var(--accent)', color: '#fff', fontSize: 12, padding: '6px 14px', borderRadius: 999 }}>All</span>
          {BLOG_CATEGORIES.map((cat) => (
            <span key={cat} className="chip" style={{ background: 'var(--bg-2)', color: 'var(--text-3)', fontSize: 12, padding: '6px 14px', borderRadius: 999, border: '1px solid var(--line)' }}>{cat}</span>
          ))}
        </section>

        {/* Blog grid */}
        <section style={{
          maxWidth: 'min(1400px, 100vw)', margin: '0 auto',
          padding: '0 clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(300px, 45vw, 380px), 1fr))',
            gap: 'clamp(16px, 2vw, 20px)',
          }}>
            {blogPosts.map((post) => (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="feature-card feature-card-lift"
                style={{ padding: 'clamp(20px, 3vw, 28px)', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999,
                    background: 'var(--bg)', border: '1px solid var(--line)',
                    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)',
                  }}>{post.category}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{post.readTime}</span>
                </div>
                <h2 style={{ fontSize: 'clamp(17px, 2.5vw, 20px)', margin: 0, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 10 }}>
                  {post.title}
                </h2>
                <p style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', lineHeight: 1.6, flex: 1 }}>
                  {post.description}
                </p>
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>#{tag}</span>
                  ))}
                </div>
                <div style={{ marginTop: 16, fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>
                  Read more →
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
