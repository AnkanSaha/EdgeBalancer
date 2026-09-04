import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials — EdgeBalancer',
  description: 'Early users on EdgeBalancer — how solo devs deploy Cloudflare load balancers and API gateways in minutes.',
  alternates: { canonical: 'https://edge.nexoral.in/testimonials' },
};

export default function TestimonialsPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)' }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// testimonials</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 700, lineHeight: 1.05 }}>
            What people are saying<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 16px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 16, lineHeight: 1.6 }}>
            Real feedback from people using EdgeBalancer. No fabricated quotes — just what users tell us.
          </p>
        </section>

        <section style={{ padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="feature-card" style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
                This is a solo project. I don&apos;t have 50 testimonials yet. But if you try EdgeBalancer and have feedback — good or bad — I&apos;d love to hear it.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="https://edge.nexoral.in/login" className="btn btn-primary">Try it free</a>
                <a href="/developers" className="btn btn-ghost">Read the docs</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
