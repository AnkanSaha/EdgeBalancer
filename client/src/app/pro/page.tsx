'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { openCashfreeCheckout } from '@/lib/cashfree';

const PRO_FEATURES = [
  'AI Provisioning — describe your LB in plain English',
  'Download Worker scripts from LB History',
  'Health Checks — auto-disable unhealthy origins',
  'Rate Limiting — protect origins from traffic spikes',
  'Cloudflare analytics per load balancer card',
  'Full AI Run details — tool calls, model chain, args & results',
];

const FREE_FEATURES = [
  'Unlimited load balancers',
  'All 7 traffic strategies',
  'Placement & path-based routing',
  'Pause / resume load balancers',
  'Deployment history',
];

export default function ProPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentNav, setCurrentNav] = useState('pro');
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleNav = (id: string) => {
    if (id === 'settings') router.push('/settings');
    else if (id === 'sessions') router.push('/sessions');
    else if (id === 'ai-runs') router.push('/ai-runs');
    else if (id === 'payments') router.push('/payments');
    else if (id === 'pro') router.push('/pro');
    else router.push('/dashboard');
  };

  const handleBuyClick = () => {
    setError('');
    setPhone('');
    setShowModal(true);
  };

  const handleConfirmBuy = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setShowModal(false);
    setLoading(true);
    try {
      const res = await api.createOrder(phone.trim());
      if (!res.success || !res.data?.paymentSessionId) {
        setError(res.message || 'Failed to create order');
        setLoading(false);
        return;
      }

      await openCashfreeCheckout(res.data.paymentSessionId);

      setPolling(true);
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        await refreshUser();
        const latest = await api.getCurrentUser();
        if (latest.data?.user?.isPro) {
          setPolling(false);
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }
      }
      setPolling(false);
      setError('Payment received! Pro status will activate shortly. Refresh the page in a moment.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  const isPro = user.isPro && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
  const expiryDate = user.proExpiresAt
    ? new Date(user.proExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="app-shell">
      <Sidebar
        current={currentNav}
        onNav={handleNav}
        onLogout={() => { }}
        userEmail={user.email}
        hasCloudflareCredentials={user.hasCloudflareCredentials}
        cloudflareOAuthConnected={user.cloudflareOAuthConnected}
        isReady={!!user.hasCloudflareCredentials}
        isPro={user.isPro}
        proExpiresAt={user.proExpiresAt}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          crumbs={['Dashboard', 'EdgeBalancer Pro']}
          title="EdgeBalancer Pro"
          subtitle="Unlock the full power of EdgeBalancer"
        />
        <div style={{ padding: 'clamp(16px, 4vw, 32px)', overflow: 'auto', flex: 1 }}>

          {success ? (
            <div style={{
              maxWidth: 500, margin: '40px auto', textAlign: 'center', padding: '48px 32px',
              background: 'var(--bg-1)', border: '1px solid var(--green)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icons.Check size={32} stroke="var(--green)" />
              </div>
              <h2 style={{ color: 'var(--green)', margin: 0 }}>Welcome to Pro!</h2>
              <p style={{ color: 'var(--text-2)', marginTop: 8 }}>Redirecting to dashboard...</p>
            </div>
          ) : isPro ? (
            <div style={{ maxWidth: 720, width: '100%', margin: '40px auto', textAlign: 'center' }}>
              <div style={{
                padding: '48px 40px', background: 'linear-gradient(135deg, #f59e0b11, #f9731611)',
                border: '1px solid #f59e0b44', borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px #f59e0b44',
                }}>
                  <Icons.Crown size={32} fill="#fff" stroke="#fff" />
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 700, color: '#f59e0b',
                  fontFamily: 'var(--mono)', letterSpacing: '0.06em',
                }}>PRO ACTIVE</div>
                <p style={{ color: 'var(--text-2)', marginTop: 14, fontSize: 15 }}>
                  Your Pro subscription is active until <strong>{expiryDate}</strong>.
                </p>
                <p style={{ color: 'var(--text-3)', marginTop: 10, fontSize: 14, lineHeight: 1.7 }}>
                  When your subscription expires, you will automatically revert to the Free plan.
                  Pro features like Health Checks, AI Provisioning, and Script Download will stop.
                  <span style={{ whiteSpace: 'nowrap' }}> Re-subscribe anytime.</span>
                </p>
                <p style={{ color: 'var(--text-3)', marginTop: 14, fontSize: 13 }}>
                  No auto-renewal. No hidden charges.
                </p>
              </div>

              {/* Benefits included */}
              <div style={{
                marginTop: 24, padding: 28, background: 'var(--bg-1)',
                border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>
                  Your Pro benefits
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PRO_FEATURES.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text)' }}>
                      <Icons.Check size={15} stroke="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              {/* Plans */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
                marginBottom: 32,
              }}>
                {/* Free */}
                <div style={{
                  padding: 28, background: 'var(--bg-1)',
                  border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
                  }}>Free</div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹0</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>forever</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {FREE_FEATURES.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-2)' }}>
                        <Icons.Check size={15} stroke="var(--green)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                    {PRO_FEATURES.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-3)', opacity: 0.6 }}>
                        <Icons.X size={15} stroke="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pro */}
                <div style={{
                  padding: 28, background: 'var(--bg-1)',
                  border: '2px solid #f59e0b', borderRadius: 'var(--radius-lg)',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: '0 0 40px #f59e0b15',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{
                      fontSize: 11, fontFamily: 'var(--mono)', color: '#f59e0b',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>Pro</div>
                    <div style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999,
                      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                      color: '#fff', fontWeight: 600,
                    }}>RECOMMENDED</div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹199</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>for 30 days</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {FREE_FEATURES.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-2)' }}>
                        <Icons.Check size={15} stroke="var(--green)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                    {PRO_FEATURES.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        <Icons.Check size={15} stroke="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* No auto-renew disclaimer */}
              <div style={{
                padding: '16px 20px', marginBottom: 24,
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)',
                lineHeight: 1.7,
              }}>
                <strong style={{ color: 'var(--text)' }}>No auto-renewal.</strong> Your Pro subscription is a one-time payment for 30 days.
                When it expires, your account automatically reverts to the Free plan.
                Features like Health Checks, AI Provisioning, and Script Download will stop working.
                You can re-subscribe anytime from this page.
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px', marginBottom: 16,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid var(--red)',
                  borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13,
                }}>
                  {error}
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleBuyClick}
                  disabled={loading || polling}
                  className="btn btn-primary"
                  style={{
                    padding: '14px 48px', fontSize: 16, fontWeight: 700,
                    background: (loading || polling) ? 'var(--text-3)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                    border: 'none', borderRadius: 'var(--radius)',
                    color: '#fff', cursor: (loading || polling) ? 'not-allowed' : 'pointer',
                    boxShadow: (loading || polling) ? 'none' : '0 4px 24px #f59e0b44',
                  }}
                >
                  {polling ? 'Confirming payment...' : loading ? 'Creating order...' : 'Upgrade to Pro — ₹199'}
                </button>
                {polling && (
                  <div style={{ fontSize: 13, color: '#f59e0b', marginTop: 12 }}>
                    Verifying payment with Cashfree, please wait...
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
                  One-time payment. No subscription. Secured by Cashfree.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Phone number modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Complete your details" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              className="input"
              value={user.email || ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Phone Number *</label>
            <input
              className="input"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={15}
            />
          </div>
          {error && (
            <div style={{ fontSize: 13, color: 'var(--red)' }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmBuy}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', border: 'none', color: '#fff' }}
            >
              Proceed to pay ₹199
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
