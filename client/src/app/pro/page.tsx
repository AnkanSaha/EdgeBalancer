'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { openCashfreeCheckout } from '@/lib/cashfree';

// All features — one entry per feature, with plan-specific labels
const ALL_FEATURES: { free: string | null; student: string | null; pro: string | null }[] = [
  { free: 'Up to 3 load balancers', student: 'Up to 10 load balancers', pro: 'Unlimited load balancers' },
  { free: '3 traffic strategies', student: 'All 7 traffic strategies', pro: 'All 7 traffic strategies' },
  { free: 'Smart Placement (auto, locked)', student: 'Custom Smart Placement', pro: 'Custom Smart Placement' },
  { free: 'Pause / resume load balancers', student: 'Pause / resume load balancers', pro: 'Pause / resume load balancers' },
  { free: 'Deployment history', student: 'Deployment history', pro: 'Deployment history' },
  { free: null, student: 'Health Checks (up to 5 LBs)', pro: 'Unlimited Health Checks' },
  { free: null, student: 'Cloudflare analytics per card', pro: 'Cloudflare analytics per card' },
  { free: null, student: 'Download Worker scripts', pro: 'Download Worker scripts' },
  { free: null, student: null, pro: 'AI Agent' },
  { free: null, student: null, pro: 'Rate Limiting' },
];

type PlanType = 'trial' | 'student' | 'pro';

export default function ProPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentNav, setCurrentNav] = useState('pro');
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('student');
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

  const handleBuyClick = (plan: PlanType) => {
    setError('');
    setPhone('');
    setSelectedPlan(plan);
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
      const res = await api.createOrder(selectedPlan, phone.trim());
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
        if (latest.data?.user?.isSubscribed) {
          setPolling(false);
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 2000);
          return;
        }
      }
      setPolling(false);
      setError('Payment received! Your plan will activate shortly. Refresh the page in a moment.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;

  const currentPlan = user.plan || 'free';
  const isActive = user.isSubscribed && user.planExpiresAt && new Date(user.planExpiresAt) > new Date();
  const expiryDate = user.planExpiresAt
    ? new Date(user.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const canTrial = !user.hasEverSubscribed;

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
        plan={user.plan}
        planExpiresAt={user.planExpiresAt}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          crumbs={['Dashboard', 'EdgeBalancer Pro']}
          title="EdgeBalancer Pro"
          subtitle="Choose the plan that fits your needs"
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
              <h2 style={{ color: 'var(--green)', margin: 0 }}>Welcome!</h2>
              <p style={{ color: 'var(--text-2)', marginTop: 8 }}>Redirecting to dashboard...</p>
            </div>
          ) : isActive ? (
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
                }}>{currentPlan === 'pro' ? 'PRO' : currentPlan === 'student' ? "STUDENT'S SUPPORT" : 'TRIAL'} ACTIVE</div>
                <p style={{ color: 'var(--text-2)', marginTop: 14, fontSize: 15 }}>
                  Your subscription is active until <strong>{expiryDate}</strong>.
                </p>

                {/* What this plan actually includes */}
                <div style={{
                  marginTop: 24, marginBottom: 8, textAlign: 'left',
                  background: 'var(--bg-1)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)', padding: '20px 22px',
                }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
                  }}>What you get with {currentPlan === 'pro' ? 'Pro' : currentPlan === 'student' ? "Student's Support" : 'Trial'}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ALL_FEATURES.filter(f => f[currentPlan as 'free' | 'student' | 'pro']).map(f => (
                      <div key={f[currentPlan as 'free' | 'student' | 'pro']!} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: 'var(--text)' }}>
                        <Icons.Check size={15} stroke="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f[currentPlan as 'free' | 'student' | 'pro']}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ color: 'var(--text-3)', marginTop: 16, fontSize: 14, lineHeight: 1.7 }}>
                  When your subscription expires, you will automatically revert to the Free plan.
                  <span style={{ whiteSpace: 'nowrap' }}> You can re-subscribe anytime.</span>
                </p>
                <p style={{ color: 'var(--text-3)', marginTop: 14, fontSize: 13 }}>
                  No auto-renewal. No hidden charges.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              {/* Trial banner */}
              {canTrial && (
                <div style={{
                  padding: '16px 24px', marginBottom: 24,
                  background: 'linear-gradient(135deg, #f59e0b11, #f9731611)',
                  border: '1px solid #f59e0b44', borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                      Try Student&apos;s Support — <span style={{ textDecoration: 'line-through', color: 'var(--text-3)' }}>₹89</span>{' '}
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>₹10</span>{' '}
                      <span style={{ fontSize: 13, color: 'var(--text-3)' }}>for 7 days</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                      First-time only. After trial, regular prices apply.
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyClick('trial')}
                    disabled={loading || polling}
                    style={{
                      padding: '10px 24px', fontSize: 14, fontWeight: 600,
                      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                      border: 'none', borderRadius: 'var(--radius)',
                      color: '#fff', cursor: 'pointer',
                    }}
                  >
                    <span style={{ textDecoration: 'line-through', opacity: 0.7, marginRight: 6 }}>₹89</span>
                    ₹10 — Start Trial
                  </button>
                </div>
              )}

              {/* Plan cards */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
                marginBottom: 32,
              }}>
                {/* Free */}
                <div style={{
                  padding: 28, background: 'var(--bg-1)',
                  border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Free</div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹0</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>forever</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ALL_FEATURES.filter(f => f.free).map(f => (
                      <div key={f.free!} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-2)' }}>
                        <Icons.Check size={15} stroke="var(--green)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f.free}</span>
                      </div>
                    ))}
                    {ALL_FEATURES.filter(f => !f.free).map(f => (
                      <div key={f.student || f.pro || ''} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-3)' }}>
                        <Icons.X size={15} stroke="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f.student || f.pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student */}
                <div style={{
                  padding: 28, background: 'var(--bg-1)',
                  border: '2px solid #3b82f6', borderRadius: 'var(--radius-lg)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #3b82f6, #6366f1)',
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student&apos;s Support</div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹89</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>for 30 days</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ALL_FEATURES.filter(f => f.student).map(f => (
                      <div key={f.student!} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text)' }}>
                        <Icons.Check size={15} stroke="#3b82f6" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f.student}</span>
                      </div>
                    ))}
                    {ALL_FEATURES.filter(f => !f.student).map(f => (
                      <div key={f.pro || ''} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-3)' }}>
                        <Icons.X size={15} stroke="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f.pro}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleBuyClick('student')}
                    disabled={loading || polling}
                    style={{
                      width: '100%', padding: '12px', marginTop: 24, fontSize: 14, fontWeight: 600,
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      border: 'none', borderRadius: 'var(--radius)',
                      color: '#fff', cursor: 'pointer',
                    }}
                  >
                    Get Student&apos;s Support — ₹89
                  </button>
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
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pro</div>
                    <div style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 999,
                      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                      color: '#fff', fontWeight: 600,
                    }}>BEST VALUE</div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>₹199</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24 }}>for 30 days</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ALL_FEATURES.map(f => (
                      <div key={f.pro!} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        <Icons.Check size={15} stroke="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                        <span>{f.pro}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleBuyClick('pro')}
                    disabled={loading || polling}
                    style={{
                      width: '100%', padding: '12px', marginTop: 24, fontSize: 14, fontWeight: 600,
                      background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                      border: 'none', borderRadius: 'var(--radius)',
                      color: '#fff', cursor: 'pointer',
                      boxShadow: '0 4px 24px #f59e0b44',
                    }}
                  >
                    Get Pro — ₹199
                  </button>
                </div>
              </div>

              {/* No auto-renew disclaimer */}
              <div style={{
                padding: '16px 20px', marginBottom: 24,
                background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)',
                lineHeight: 1.7,
              }}>
                <strong style={{ color: 'var(--text)' }}>No auto-renewal.</strong> All subscriptions are one-time payments.
                When your plan expires, your account automatically reverts to the Free plan.
                <span style={{ whiteSpace: 'nowrap' }}> You can re-subscribe anytime.</span>
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

              {polling && (
                <div style={{ textAlign: 'center', padding: 16, color: '#f59e0b', fontSize: 14 }}>
                  Verifying payment with Cashfree, please wait...
                </div>
              )}
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
              {selectedPlan === 'trial' ? 'Pay ₹10' : selectedPlan === 'student' ? 'Pay ₹89' : 'Pay ₹199'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Loading overlay — shown between modal close and Cashfree checkout open */}
      {loading && !polling && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-1)', borderRadius: 'var(--radius-lg)',
            padding: '32px 48px', textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto 16px',
              border: '3px solid var(--line)', borderTopColor: 'var(--accent)',
              borderRadius: '50%', animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{ fontSize: 14, color: 'var(--text-2)' }}>Opening payment gateway...</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Please wait</div>
          </div>
        </div>
      )}
    </div>
  );
}
