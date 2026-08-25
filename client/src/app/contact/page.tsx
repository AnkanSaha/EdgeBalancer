import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — EdgeBalancer',
  description: 'Get in touch with the EdgeBalancer team. Contact us for support, feedback, security reports, or partnership inquiries.',
  alternates: { canonical: 'https://edge.nexoral.in/contact' },
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Nav />

      <main style={{ position: 'relative', zIndex: 5 }}>
        {/* Header */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
        }}>
          <div className="kicker" style={{ marginBottom: 12 }}>// contact</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', margin: 0, letterSpacing: '-0.035em', fontWeight: 600, lineHeight: 1.05 }}>
            Get in touch<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', color: 'var(--text-2)', maxWidth: 720, marginTop: 24, lineHeight: 1.6 }}>
            Have a question, feedback, or need help? We&apos;d love to hear from you.
            We typically respond within 24 hours.
          </p>
        </section>

        {/* Contact cards */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 360px), 1fr))', gap: 'clamp(16px, 2vw, 20px)' }}>
            {/* Email */}
            <div className="feature-card" style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius)',
                backgroundImage: 'linear-gradient(to bottom right, #f59e0b26, #fe6e0014)',
                border: '1px solid #f59e0b40',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 600, margin: 0, marginBottom: 8 }}>Email</h2>
              <p style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
                For general inquiries, support, feature requests, and feedback. We read every email.
              </p>
              <a href="mailto:connect@ankan.in" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                connect@ankan.in
              </a>
            </div>

            {/* Security */}
            <div className="feature-card" style={{ padding: 'clamp(20px, 3vw, 28px)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius)',
                backgroundImage: 'linear-gradient(to bottom right, #f59e0b26, #fe6e0014)',
                border: '1px solid #f59e0b40',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
              </div>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', fontWeight: 600, margin: 0, marginBottom: 8 }}>Security</h2>
              <p style={{ fontSize: 'clamp(13px, 1.8vw, 14px)', color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
                Found a security vulnerability? Please report it responsibly. We take security seriously and will respond quickly.
              </p>
              <a href="mailto:connect@ankan.in?subject=Security%20Vulnerability%20Report" className="btn btn-ghost" style={{ display: 'inline-flex' }}>
                Report a vulnerability
              </a>
            </div>
          </div>
        </section>

        {/* Legal links */}
        <section style={{
          padding: 'clamp(48px, 8vh, 80px) clamp(16px, 4vw, 48px)',
          borderTop: '1px solid var(--line)',
        }}>
          <div className="feature-card" style={{ padding: 'clamp(20px, 3vw, 28px)', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 600, margin: 0, marginBottom: 4 }}>Legal & Compliance</h3>
              <p style={{ fontSize: 'clamp(13px, 1.6vw, 14px)', color: 'var(--text-3)', margin: 0 }}>DPDP Act 2023 and GDPR compliant</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="/privacy" className="btn btn-ghost btn-sm">Privacy Policy</a>
              <a href="/terms" className="btn btn-ghost btn-sm">Terms of Service</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
