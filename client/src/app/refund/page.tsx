import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — EdgeBalancer',
  description:
    'EdgeBalancer refund policy. All plans are INR via Cashfree with 3-day monthly and 7-day annual refund windows before any load balancer or gateway is deployed.',
  alternates: { canonical: 'https://edge.nexoral.in/refund' },
};

export default function RefundPage() {
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
        <div className="kicker" style={{ marginBottom: 12 }}>
          // legal
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            margin: 0,
            letterSpacing: '-0.03em',
            fontWeight: 600,
          }}
        >
          Refund Policy
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
              1. Scope
            </h2>
            <p>
              This Refund Policy applies to all paid EdgeBalancer plans purchased in Indian Rupees
              (INR) via our payment partner <strong>Cashfree</strong>. By purchasing a plan you
              agree to the conditions described below.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              2. Trial — No Charge, No Refund Needed
            </h2>
            <p>
              The Free Trial is free and requires no payment. Because no charge is collected, there
              is nothing to refund. Trial access simply expires at the end of the trial period.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              3. Monthly Plans
            </h2>
            <p>
              Monthly paid plans are <strong>Student — ₹49 / month</strong> and{' '}
              <strong>Pro — ₹299 / month</strong> (30-day tenure, one-time payment, no
              auto-renewal).
            </p>
            <p style={{ marginTop: 8 }}>
              A full refund is available within <strong>3 calendar days</strong> of the order only
              if <strong>no load balancer or gateway has been deployed</strong> under the plan.
              Once any load balancer or gateway has been created and deployed, the service is
              considered consumed and <strong>no refund</strong> will be issued for that order.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              4. Annual Plans
            </h2>
            <p>
              Annual paid plans are <strong>Student-annual — ₹470 / year</strong> and{' '}
              <strong>Pro-annual — ₹2,870 / year</strong>. Annual plans save 20% versus paying
              monthly.
            </p>
            <p style={{ marginTop: 8 }}>
              A full refund is available within <strong>7 calendar days</strong> of the order only
              if <strong>no load balancer or gateway has been deployed</strong> under the plan.
              Once any load balancer or gateway has been deployed, the service is considered
              consumed and <strong>no refund</strong> will be issued.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              5. Upgrades &amp; Downgrades
            </h2>
            <p>
              When you <strong>upgrade</strong> (for example Free → Student, Student → Pro, or
              monthly → annual), a new order is created. The refund window for that upgrade order
              is counted from the <strong>upgrade time</strong> and follows the same rules above
              (3 days for monthly upgrades, 7 days for annual upgrades, only if no LB/gateway has
              been deployed after the upgrade).
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>Downgrades are not refundable.</strong> If you downgrade to a lower plan, the
              current higher plan remains active until its <span className="mono">planExpiresAt</span>{' '}
              and then reverts to the lower tier. No partial refund is issued for the price
              difference.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              6. How to Request a Refund
            </h2>
            <p>To request a refund within the eligible window:</p>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <li>
                Email <a href="mailto:support@nexoral.in" style={{ color: 'var(--accent)' }}>support@nexoral.in</a> from your registered email address.
              </li>
              <li>Include your Cashfree <strong>orderId</strong> and the reason for the request.</li>
              <li>We will verify eligibility (window + no deployment) and confirm by reply email.</li>
            </ol>
            <div
              className="feature-card"
              style={{
                marginTop: 16,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.7,
                color: 'var(--text-2)',
              }}
            >
              <strong style={{ color: 'var(--text)' }}>Processing:</strong> Approved refunds are
              processed within <strong>7–10 business days</strong> to the original payment method
              via Cashfree. After we initiate the refund, your bank or card issuer may take an
              additional <strong>2–5 business days</strong> to credit the amount.
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              7. No Refund After Window or After Expiry
            </h2>
            <p>No refund will be issued:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <li>After the 3-day (monthly) or 7-day (annual) window has passed.</li>
              <li>After the plan has expired — expired plans are not refundable.</li>
              <li>If any load balancer or gateway has been deployed under that order (service consumed).</li>
              <li>For downgrades or for the unused portion of an active tenure.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              8. Jurisdiction
            </h2>
            <p>
              This policy is governed by the laws of <strong>India</strong>. Any disputes arising
              from payments or refunds are subject to the exclusive jurisdiction of the courts in
              Kolkata, West Bengal, and to your rights under the{' '}
              <strong>Consumer Protection Act, 2019</strong>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              9. Contact
            </h2>
            <p>For refund-related questions:</p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@nexoral.in" style={{ color: 'var(--accent)' }}>
                support@nexoral.in
              </a>
            </p>
            <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>
              Please include your orderId for the fastest resolution.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
