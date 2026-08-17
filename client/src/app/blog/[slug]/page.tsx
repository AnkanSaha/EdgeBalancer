import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { blogPosts, getBlogPost, getAllBlogSlugs } from '@/lib/blogData';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const SITE_URL = 'https://edge.nexoral.in';

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: 'EdgeBalancer',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@type': 'Organization', name: 'EdgeBalancer' },
    publisher: { '@type': 'Organization', name: 'EdgeBalancer' },
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        <article style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: 32, fontSize: 13, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>
            <a href="/" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Home</a>
            <span style={{ margin: '0 8px' }}>/</span>
            <a href="/blog" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>Blog</a>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--text-2)' }}>{post.title}</span>
          </nav>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)',
            }}>{post.category}</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>·</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{post.readTime} read</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600, lineHeight: 1.1, marginBottom: 24 }}>
            {post.title}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 40 }}>
            {post.description}
          </p>

          {/* Content */}
          <div
            className="blog-content"
            style={{
              fontSize: 'clamp(15px, 2vw, 16px)',
              lineHeight: 1.8,
              color: 'var(--text-2)',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />

          {/* Tags */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{ padding: '4px 12px', borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>#{tag}</span>
            ))}
          </div>

          {/* CTA */}
          <div className="feature-card" style={{ marginTop: 48, padding: 'clamp(24px, 3vw, 32px)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'clamp(20px, 2.5vw, 24px)', margin: 0, fontWeight: 600 }}>Ready to try it?</h3>
            <p style={{ fontSize: 'clamp(14px, 1.8vw, 15px)', color: 'var(--text-2)', marginTop: 8, marginBottom: 20 }}>
              Deploy your first load balancer in 90 seconds. Free under 100k requests/day.
            </p>
            <a href="/register" className="btn btn-primary">Start free →</a>
          </div>
        </article>
      </main>

      <Footer />

      <style>{`
        .blog-content h2 { font-size: clamp(22px, 3vw, 26px); font-weight: 600; margin-top: clamp(32px, 4vw, 48px); margin-bottom: 16px; letter-spacing: -0.02em; color: var(--text); }
        .blog-content h3 { font-size: clamp(18px, 2.5vw, 20px); font-weight: 600; margin-top: clamp(24px, 3vw, 32px); margin-bottom: 12px; color: var(--text); }
        .blog-content p { margin-bottom: 16px; }
        .blog-content ul, .blog-content ol { margin-bottom: 16px; padding-left: 24px; }
        .blog-content li { margin-bottom: 8px; }
        .blog-content code { font-family: var(--mono); font-size: 0.9em; background: var(--bg-2); padding: 2px 6px; border-radius: 4px; color: var(--accent); }
        .blog-content pre { background: var(--bg-2); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; overflow-x: auto; margin-bottom: 16px; }
        .blog-content pre code { background: none; padding: 0; color: var(--text-2); }
        .blog-content table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
        .blog-content th, .blog-content td { padding: 10px 12px; border: 1px solid var(--line); text-align: left; }
        .blog-content th { background: var(--bg-2); font-weight: 600; color: var(--text); }
        .blog-content a { color: var(--accent); text-decoration: underline; }
        .blog-content blockquote { border-left: 3px solid var(--accent); padding-left: 16px; margin: 16px 0; color: var(--text-3); font-style: italic; }
      `}</style>
    </div>
  );
}

/** Minimal markdown → HTML renderer (covers the subset we use). */
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^\*\*(.+?)\*\*$/gm, '<p><strong>$1</strong></p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\| (.+) \|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map((c) => c.trim());
      const isHeader = cells.every((c) => /^-+$/.test(c));
      if (isHeader) return '';
      return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (match) => `<table>${match}</table>`)
    .replace(/^(?!<[hulo]|<tr|<table)(.+)$/gm, '<p>$1</p>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\n{2,}/g, '\n');
}
