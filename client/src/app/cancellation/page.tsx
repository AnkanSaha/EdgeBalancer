import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation Policy — EdgeBalancer',
  description:
    'EdgeBalancer cancellation policy. All plans are one-time with no auto-renewal; cancellation keeps active tenure until expiry, then reverts to Free.',
  alternates: { canonical: 'https://edge.nexoral.in/cancellation' },
};

export default function CancellationPage() {
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
          Cancellation Policy
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
              1. One-Time Plans — No Auto-Renewal
            </h2>
            <p>
              All EdgeBalancer plans — Free, Student (₹49/month), Pro (₹299/month), Student-annual
              (₹470/year), and Pro-annual (₹2,870/year) — are <strong>one-time purchases</strong>.
              There is <strong>no auto-renewal</strong> and no recurring charge. Your plan is
              active for its stated tenure (30 days for monthly, 365 days for annual) from the time
              of purchase.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              2. What Cancellation Means
            </h2>
            <p>
              Cancellation does not immediately strip your entitlements. If you cancel, your current
              active tenure <strong>continues until the plan&apos;s </strong>
              <span className="mono" style={{ color: 'var(--text)' }}>
                planExpiresAt
              </span>{' '}
              timestamp. On that date the account automatically <strong>reverts to the Free</strong>{' '}
              plan. No further action or payment is required from you.
            </p>
            <div
              className="feature-card"
              style={{ marginTop: 16, padding: 16, fontSize: 13, lineHeight: 1.7 }}
            >
              <strong style={{ color: 'var(--text)' }}>Example:</strong> You purchase Pro on 1
              August. You cancel on 10 August. Pro features remain active until 31 August
              (30-day tenure), then the account reverts to Free.
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              3. What Does Not Cancel Your Plan
            </h2>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li>
                <strong>Deleting load balancers or gateways</strong> does not cancel your plan.
                Your plan tenure and entitlements remain until expiry. Data for deleted resources
                is removed, but the plan itself is unaffected.
              </li>
              <li>
                <strong>Deactivating or rotating your Cloudflare API token</strong> does not cancel
                your plan. It only prevents new deploys or updates. The plan and its expiry are
                managed entirely inside EdgeBalancer.
              </li>
              <li>
                <strong>Removing Cloudflare credentials from EdgeBalancer settings</strong> also does
                not cancel the plan — it only disconnects the deployment capability.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              4. No Partial Refund for Unused Days
            </h2>
            <p>
              Because plans are one-time, there is <strong>no partial or pro-rata refund</strong>{' '}
              for the unused portion of an active tenure if you stop using the service early. The
              only adjustment is when you <strong>upgrade</strong>: you pay only the price
              difference to move to the higher plan immediately. See the{' '}
              <a href="/refund" style={{ color: 'var(--accent)' }}>
                Refund Policy
              </a>{' '}
              for upgrade refund windows.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              5. Data Retention
            </h2>
            <p>
              Your load balancer and gateway configurations, deployment sessions, and related
              metadata are retained for as long as the resources exist. They are{' '}
              <strong>not deleted on plan cancellation or expiry</strong> — they remain until you
              explicitly delete the load balancer or gateway. When you delete a resource, its
              configuration and the associated Cloudflare Worker are removed permanently.
            </p>
            <p style={{ marginTop: 8 }}>
              Account data is deleted only when you delete your account, in line with our{' '}
              <a href="/privacy" style={{ color: 'var(--accent)' }}>
                Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              6. How to Cancel
            </h2>
            <p>You have two options:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <li>
                <strong>Let it expire automatically.</strong> Do nothing — because there is no
                auto-renewal, the plan expires on its own at <span className="mono">planExpiresAt</span>{' '}
                and your account reverts to Free.
              </li>
              <li>
                <strong>Contact support.</strong> Email{' '}
                <a href="mailto:support@nexoral.in" style={{ color: 'var(--accent)' }}>
                  support@nexoral.in
                </a>{' '}
                from your registered email address and request cancellation. We will confirm that
                the active tenure will run until expiry and then revert to Free.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              7. After Cancellation
            </h2>
            <p>
              Your deployed Workers continue to serve traffic on Cloudflare&apos;s edge even after
              cancellation, until you delete them. When the plan reverts to Free, Free-tier limits
              apply (up to 5 load balancers, health checks on up to 2 LBs, etc.). Existing
              resources beyond Free limits are not automatically deleted but you will need to reduce
              to within Free limits before creating new ones.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              8. Contact
            </h2>
            <p>Questions about cancellation or your current tenure?</p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@nexoral.in" style={{ color: 'var(--accent)' }}>
                support@nexoral.in
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
