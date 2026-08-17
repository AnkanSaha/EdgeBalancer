import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'EdgeBalancer privacy policy. How we collect, use, and protect your data. Compliant with DPDP Act 2023 and GDPR.',
  alternates: { canonical: 'https://edge.nexoral.in/privacy' },
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-bg" />
      <Nav />

      <main style={{ position: 'relative', zIndex: 5, maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)' }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// legal</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Last updated: August 2026</p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 32, fontSize: 'clamp(14px, 2vw, 15px)', lineHeight: 1.8, color: 'var(--text-2)' }}>
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>1. Information We Collect</h2>
            <p><strong>Account information:</strong> Name, email address, and Firebase UID when you sign in via Google OAuth.</p>
            <p><strong>Cloudflare credentials:</strong> Your Cloudflare Account ID and API token (or OAuth tokens), encrypted with AES-256-GCM before storage. We never see or store plaintext credentials.</p>
            <p><strong>Load balancer configuration:</strong> Origin server URLs, routing strategies, weights, and domain settings you configure through the dashboard.</p>
            <p><strong>Usage data:</strong> Pages visited, features used, and error logs for service improvement. No production traffic data is collected.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>2. How We Use Your Information</h2>
            <p>We use your information solely to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Provide and maintain the EdgeBalancer service</li>
              <li>Deploy and manage Cloudflare Workers on your behalf</li>
              <li>Authenticate your account and secure your data</li>
              <li>Improve the service and fix issues</li>
            </ul>
            <p style={{ marginTop: 12 }}><strong>We do not:</strong> sell your data, access your production traffic, or use your credentials for any purpose other than the operations you initiate.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>3. Data Storage and Security</h2>
            <p>All sensitive data (Cloudflare credentials, API tokens) is encrypted with AES-256-GCM before storage in MongoDB Atlas. Encryption keys are stored separately from the database.</p>
            <p>Communication is encrypted via TLS. Authentication uses JWT tokens in httpOnly cookies with SameSite=Strict policy.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>4. Data Sharing</h2>
            <p>We share data only with:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Cloudflare:</strong> API calls on your behalf to deploy Workers and manage DNS</li>
              <li><strong>MongoDB Atlas:</strong> Database hosting (data is encrypted at rest)</li>
              <li><strong>Firebase:</strong> Google OAuth authentication</li>
            </ul>
            <p style={{ marginTop: 12 }}>We do not share data with advertising networks, data brokers, or any third parties not listed above.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>5. Your Rights (DPDP Act 2023 & GDPR)</h2>
            <p>Under the Digital Personal Data Protection Act 2023 (India) and GDPR (EU), you have the right to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Data portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Withdraw consent:</strong> Revoke consent for data processing at any time</li>
            </ul>
            <p style={{ marginTop: 12 }}>To exercise these rights, email <a href="mailto:connect@ankan.in" style={{ color: 'var(--accent)' }}>connect@ankan.in</a>.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>6. Data Retention</h2>
            <p>We retain your data as long as your account is active. When you delete your account, all personal data, credentials, and load balancer configurations are permanently deleted within 30 days.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>7. Cookies</h2>
            <p>We use essential cookies only:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong>Session cookie:</strong> httpOnly, SameSite=Strict, 24-hour expiry for authentication</li>
              <li><strong>OAuth state cookie:</strong> httpOnly, SameSite=Lax, 5-minute expiry for CSRF protection during Cloudflare OAuth</li>
            </ul>
            <p style={{ marginTop: 12 }}>No tracking cookies, analytics cookies, or advertising cookies are used.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>8. Children&apos;s Privacy</h2>
            <p>EdgeBalancer is not directed at children under 13. We do not knowingly collect data from children.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>9. Changes to This Policy</h2>
            <p>We will notify you of significant changes via email or a notice on the dashboard. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>10. Contact</h2>
            <p>For privacy-related inquiries, data requests, or complaints:</p>
            <p><strong>Email:</strong> <a href="mailto:connect@ankan.in" style={{ color: 'var(--accent)' }}>connect@ankan.in</a></p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
