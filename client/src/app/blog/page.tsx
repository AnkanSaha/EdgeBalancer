'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { blogPosts, BLOG_CATEGORIES } from '@/lib/blogData';

const POSTS_PER_PAGE = 9;

export default function BlogPage() {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [activeCategory, setActiveCategory] = useState('All');
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter((p) => p.category === activeCategory);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + POSTS_PER_PAGE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [activeCategory]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// blog</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Guides &amp; tutorials<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            Everything about Cloudflare Workers load balancing — from getting started to advanced strategies, cost optimization, and production best practices.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 12, fontFamily: 'var(--mono)' }}>
            {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          </p>
        </section>

        {/* Category filters */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
          display: 'flex', gap: 8, flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveCategory('All')}
            style={{
              background: activeCategory === 'All' ? 'var(--accent)' : 'var(--bg-2)',
              color: activeCategory === 'All' ? '#fff' : 'var(--text-3)',
              fontSize: 12, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              border: activeCategory === 'All' ? 'none' : '1px solid var(--line)',
              fontFamily: 'var(--mono)',
            }}
          >All ({blogPosts.length})</button>
          {BLOG_CATEGORIES.map((cat) => {
            const count = blogPosts.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: activeCategory === cat ? 'var(--accent)' : 'var(--bg-2)',
                  color: activeCategory === cat ? '#fff' : 'var(--text-3)',
                  fontSize: 12, padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                  border: activeCategory === cat ? 'none' : '1px solid var(--line)',
                  fontFamily: 'var(--mono)',
                }}
              >{cat} ({count})</button>
            );
          })}
        </section>

        {/* Blog grid */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(300px, 45vw, 380px), 1fr))',
            gap: 'clamp(16px, 2vw, 20px)',
          }}>
            {visible.map((post) => (
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
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
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

          {hasMore && (
            <div ref={loaderRef} style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 32, height: 32, margin: '0 auto',
                border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
                borderRadius: '50%', animation: 'spin 0.9s linear infinite',
              }} />
            </div>
          )}

          {!hasMore && visible.length > 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 14 }}>
              All {filtered.length} articles shown
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
