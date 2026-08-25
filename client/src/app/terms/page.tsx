import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'EdgeBalancer terms of service. Rules governing use of the Cloudflare Worker load balancer platform.',
  alternates: { canonical: 'https://edge.nexoral.in/terms' },
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />

      <main style={{ position: 'relative', zIndex: 5, maxWidth: 800, margin: '0 auto', padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)' }}>
        <div className="kicker" style={{ marginBottom: 12 }}>// legal</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', margin: 0, letterSpacing: '-0.03em', fontWeight: 600 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Last updated: August 2026</p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 32, fontSize: 'clamp(14px, 2vw, 15px)', lineHeight: 1.8, color: 'var(--text-2)' }}>
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>1. Acceptance of Terms</h2>
            <p>By accessing or using EdgeBalancer, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>2. Description of Service</h2>
            <p>EdgeBalancer is a control plane for deploying and managing Cloudflare Worker-based load balancers. We generate and deploy Worker scripts to your Cloudflare account based on your configuration.</p>
            <p style={{ marginTop: 8 }}><strong>Important:</strong> EdgeBalancer does not proxy your traffic. All requests flow directly between Cloudflare edge and your origin servers. We only manage the Worker scripts and configuration metadata.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>3. Your Cloudflare Account</h2>
            <p>You must have a Cloudflare account to use EdgeBalancer. You provide your Cloudflare credentials (API token or OAuth authorization) to enable Worker deployment. You are responsible for:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Maintaining the security of your Cloudflare account</li>
              <li>Ensuring your API token has the minimum required permissions</li>
              <li>Any costs incurred on your Cloudflare account from Worker usage</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to access other users&apos; data or configurations</li>
              <li>Interfere with the service&apos;s operation or infrastructure</li>
              <li>Use the service to deploy malicious Workers or spam</li>
              <li>Attempt to reverse engineer or extract the service&apos;s source code</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>5. Service Availability</h2>
            <p>EdgeBalancer is provided &quot;as is&quot; without uptime guarantees. The Worker scripts we deploy run independently on Cloudflare&apos;s edge — if EdgeBalancer is temporarily unavailable, your load balancers continue to function. We are not responsible for Cloudflare service disruptions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>6. Intellectual Property</h2>
            <p>EdgeBalancer and its associated trademarks, logos, and software are the property of EdgeBalancer Inc. The generated Worker scripts are deployed to your account and are yours to use as you see fit. You retain full ownership of your configurations and data.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, EdgeBalancer and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the service.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>8. Termination</h2>
            <p>You may terminate your account at any time by deleting all load balancers and your account from the dashboard. We may terminate or suspend access for violations of these terms.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>9. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>10. Contact</h2>
            <p>For questions about these terms:</p>
            <p><strong>Email:</strong> <a href="mailto:connect@ankan.in" style={{ color: 'var(--accent)' }}>connect@ankan.in</a></p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
