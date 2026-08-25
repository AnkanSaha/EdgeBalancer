import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Security — EdgeBalancer',
  description:
    'EdgeBalancer security: AES-256-GCM at rest, TLS + httpOnly SameSite Strict in transit, bcrypt passwords, minimal Cloudflare token scopes, and no traffic proxy.',
  alternates: { canonical: 'https://edge.nexoral.in/security' },
};

export default function SecurityPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />

      <main
        style={{
          position: 'relative',
          zIndex: 5,
          maxWidth: 800,
          margin: '0 auto',
          padding: 'clamp(48px, 6vw, 96px) clamp(16px, 4vw, 48px) clamp(64px, 8vw, 128px)',
        }}
      >
        <div className="kicker" style={{ marginBottom: 12 }}>// security</div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            margin: 0,
            letterSpacing: '-0.03em',
            fontWeight: 600,
          }}
        >
          Security
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>Last updated: August 2026</p>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            fontSize: 'clamp(14px, 2vw, 15px)',
            lineHeight: 1.8,
            color: 'var(--text-2)',
          }}
        >
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              1. Data at Rest — AES-256-GCM
            </h2>
            <p>
              Cloudflare credentials (Account ID and API token or OAuth tokens) are encrypted with{' '}
              <strong>AES-256-GCM</strong> before they are written to MongoDB Atlas. Each value is
              stored alongside its own IV and GCM authentication tag (
              <span className="mono" style={{ fontSize: 13 }}>cloudflareAccountIdIv/Tag</span> and{' '}
              <span className="mono" style={{ fontSize: 13 }}>cloudflareTokenIv/Tag</span>). The{' '}
              <span className="mono" style={{ fontSize: 13 }}>ENCRYPTION_KEY</span> is a 32-byte
              (64-hex-char) key held in the server environment — never in the database — and the
              service fails fast if the key is missing or of the wrong length.
            </p>
            <p style={{ marginTop: 8 }}>
              TOTP secrets for two-factor authentication are encrypted the same way, per device.
              Worker scripts and configuration metadata stored for deployment history contain only
              origin URLs, weights, and strategy choices — no secrets.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              2. Data in Transit — TLS &amp; Hardened Cookies
            </h2>
            <p>
              All communication between browser, EdgeBalancer, and upstream providers is encrypted
              with <strong>TLS</strong>. Authentication uses <strong>JWTs in httpOnly cookies</strong>{' '}
              with <span className="mono" style={{ fontSize: 13 }}>SameSite=Strict</span>. The
              session cookie is 24-hour expiry; the 2FA challenge cookie (
              <span className="mono" style={{ fontSize: 13 }}>eb_2fa</span>) is 5-minute expiry and
              carries <span className="mono" style={{ fontSize: 13 }}>stage: &apos;pending-2fa&apos;</span>{' '}
              so it can never be renamed into a session — the auth middleware rejects any token that
              carries a stage.
            </p>
            <p style={{ marginTop: 8 }}>
              CORS is restricted to the configured{' '}
              <span className="mono" style={{ fontSize: 13 }}>CORS_ORIGIN</span> /{' '}
              <span className="mono" style={{ fontSize: 13 }}>CLIENT_URL</span>. Error responses
              never leak credentials, stack traces, or internal IDs.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              3. Passwords — bcrypt
            </h2>
            <p>
              Where a password is set, it is hashed with <strong>bcrypt (10 rounds)</strong>{' '}
              before storage. Plaintext passwords are never written to the database or to logs.
              Google-only accounts have a null password and authenticate via Firebase ID tokens.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              4. Cloudflare Token Permissions
            </h2>
            <p style={{ marginBottom: 16 }}>
              EdgeBalancer requests the minimum Cloudflare token scopes required to operate. Each
              maps to an endpoint the service actually calls:
            </p>
            <div
              className="feature-card"
              style={{ padding: 0, overflow: 'hidden', fontSize: 13, lineHeight: 1.6 }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--bg-1)' }}>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-3)',
                          fontWeight: 600,
                        }}
                      >
                        Permission
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--text-3)',
                          fontWeight: 600,
                        }}
                      >
                        Used by
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--text-2)' }}>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>
                          Account · Workers Scripts · Edit
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>
                        <span className="mono" style={{ fontSize: 12 }}>
                          /accounts/{'{id}'}/workers/scripts
                        </span>{' '}
                        — deploy, versions, deployments, delete; and{' '}
                        <span className="mono" style={{ fontSize: 12 }}>/workers/domains</span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>
                          Zone · Zone · Read
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>
                        <span className="mono" style={{ fontSize: 12 }}>/zones</span> — zone list
                        for the domain picker
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>
                          Zone · DNS · Edit
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>
                        <span className="mono" style={{ fontSize: 12 }}>/zones/{'{id}'}/dns_records</span> — grey-cloud
                        records for raw-IP origins
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-2)' }}>Not needed:</strong> Workers KV Storage.
              Nothing binds or reads KV. An optional{' '}
              <span className="mono" style={{ fontSize: 12 }}>Zone · Workers Routes · Read</span> scope improves
              hostname-conflict detection when present, but deploys work without it.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              5. No Traffic Proxy
            </h2>
            <p>
              EdgeBalancer <strong>never proxies your production traffic</strong>. All requests flow
              directly from the Cloudflare edge to your origin servers via the Worker script
              deployed in <em>your</em> Cloudflare account. We store only metadata — origin URLs,
              weights, strategy choice — encrypted at rest. If EdgeBalancer is temporarily
              unavailable, your load balancers and gateways continue to serve traffic.
            </p>
            <p style={{ marginTop: 8 }}>
              You retain full ownership: delete the API token or the Worker scripts from the
              Cloudflare dashboard and the deployment is gone — there is no lock-in.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              6. Responsible Disclosure
            </h2>
            <p>
              If you discover a security vulnerability, please report it responsibly. Do not publicly
              disclose the issue until we have had a chance to address it.
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Contact:</strong>{' '}
              <a href="mailto:security@nexoral.in" style={{ color: 'var(--accent)' }}>
                security@nexoral.in
              </a>
            </p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>
              Please include a description of the vulnerability, steps to reproduce, and the
              potential impact. We will acknowledge receipt within 2 business days and keep you
              updated on the fix.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
