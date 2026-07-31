'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { OtpInput } from '@/components/auth/OtpInput';
import toast from 'react-hot-toast';
import { permissionSummary } from '@/lib/cloudflarePermissions';
import type { TotpDevice } from '@/types/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'row' }}>
      <Sidebar
        current="settings"
        onNav={(id) => {
          if (id === 'balancers') router.push('/dashboard');
          else if (id === 'settings') router.push('/settings');
        }}
        onLogout={handleLogout}
        userEmail={user?.email}
      />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar
          crumbs={['Dashboard', 'Settings']}
          title="Settings"
          subtitle="Manage your Cloudflare integration"
        />
        <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: 1100, overflow: 'auto', flex: 1 }}>
          {/* auto-fit collapses to a single column under ~740px without a media query */}
          <div
            className="slide-in"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <CloudflareTab user={user} refreshUser={refreshUser} />
            <TwoFactorCard user={user} refreshUser={refreshUser} />
          </div>
        </div>
      </main>
    </div>
  );
}

function TwoFactorCard({ user, refreshUser }: any) {
  const devices: TotpDevice[] = user?.totpDevices || [];
  const [mode, setMode] = useState<'idle' | 'enrolling' | 'removing'>('idle');
  const [enrolment, setEnrolment] = useState<{ deviceId: string; name: string; secret: string; qrDataUrl: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TotpDevice | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode('idle');
    setEnrolment(null);
    setRemoveTarget(null);
    setName('');
    setCode('');
    setCodeError(false);
  };

  const startEnrolment = async () => {
    setBusy(true);
    try {
      const response = await api.setupTotp({ name: name.trim() });
      setEnrolment(response.data);
      setMode('enrolling');
      setCode('');
      setCodeError(false);
    } catch (error: any) {
      toast.error(error.message || 'Could not start setup');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (value: string) => {
    setBusy(true);
    setCodeError(false);
    try {
      if (mode === 'enrolling' && enrolment) {
        await api.confirmTotp({ deviceId: enrolment.deviceId, code: value });
        toast.success('Authenticator app added');
      } else if (mode === 'removing' && removeTarget) {
        await api.removeTotp({ deviceId: removeTarget.id, code: value });
        toast.success('Authenticator app removed');
      }
      await refreshUser();
      reset();
    } catch (error: any) {
      toast.error(error.message || 'That code is not valid');
      setCodeError(true);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const codePrompt = mode === 'enrolling'
    ? 'Enter the 6-digit code your app is showing to finish setup.'
    : devices.length > 1
      ? 'Enter a code from one of your other authenticator apps to remove this one.'
      : 'This is your last authenticator app — removing it turns two-factor authentication off.';

  return (
    <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.06, pointerEvents: 'none' }}>
        <Icons.Shield size={80} />
      </div>

      <div style={{ position: 'relative' }}>
        <div className="kicker" style={{ marginBottom: 8 }}>// account security</div>
        <h2 style={{ fontSize: 22, margin: 0, letterSpacing: '-0.02em', fontWeight: 500 }}>
          Two-Factor Authentication
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 28, lineHeight: 1.6 }}>
          Protect sign-in with a time-based code from an authenticator app. Enrol as many apps as you
          like so losing one device does not lock you out — there are no recovery codes.
        </p>

        {mode === 'enrolling' && enrolment ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="kicker">
              Setting up <span style={{ color: 'var(--accent)' }}>{enrolment.name}</span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', padding: 16,
              background: '#fff', borderRadius: 'var(--radius)', alignSelf: 'center',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrolment.qrDataUrl} alt="Scan this QR code with your authenticator app" width={200} height={200} />
            </div>

            <div style={{ padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
              <div className="kicker" style={{ marginBottom: 8 }}>Or enter this key manually</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>
                  {enrolment.secret.replace(/(.{4})/g, '$1 ').trim()}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(enrolment.secret);
                    toast.success('Key copied');
                  }}
                >
                  <Icons.Copy size={14} />
                </button>
              </div>
            </div>

            <div>
              <div className="field-label" style={{ marginBottom: 12 }}>{codePrompt}</div>
              <OtpInput
                value={code}
                onChange={(value) => { setCode(value); if (codeError) setCodeError(false); }}
                onComplete={submitCode}
                error={codeError}
                disabled={busy}
              />
            </div>

            <button type="button" className="btn btn-ghost" onClick={reset} disabled={busy} style={{ alignSelf: 'flex-start' }}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {devices.length === 0 ? (
              <div style={{
                padding: 16, background: 'var(--bg-2)',
                border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-3)' }} />
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  Two-factor authentication is off
                </div>
              </div>
            ) : (
              devices.map((device) => (
                <div key={device.id}>
                  <div style={{
                    padding: 16, background: 'var(--bg-2)',
                    border: `1px solid ${removeTarget?.id === device.id ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius)',
                    display: 'flex', gap: 12, alignItems: 'center',
                    transition: 'border-color 140ms',
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>{device.name}</div>
                      <div className="hint">Added {new Date(device.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      aria-label={`Remove ${device.name}`}
                      onClick={() => {
                        if (removeTarget?.id === device.id) {
                          reset();
                          return;
                        }
                        setMode('removing');
                        setRemoveTarget(device);
                        setCode('');
                        setCodeError(false);
                      }}
                    >
                      <Icons.Trash size={14} />
                    </button>
                  </div>

                  {mode === 'removing' && removeTarget?.id === device.id && (
                    <div className="fade-in" style={{ paddingTop: 16 }}>
                      <div className="hint" style={{ marginBottom: 12, color: devices.length > 1 ? 'var(--text-3)' : 'var(--red)' }}>
                        {codePrompt}
                      </div>
                      <OtpInput
                        value={code}
                        onChange={(value) => { setCode(value); if (codeError) setCodeError(false); }}
                        onComplete={submitCode}
                        error={codeError}
                        disabled={busy}
                      />
                    </div>
                  )}
                </div>
              ))
            )}

            {devices.length === 1 && (
              <div className="hint" style={{ color: 'var(--accent)' }}>
                Add a second app — with only one enrolled, losing that device locks you out.
              </div>
            )}

            <div className="field">
              <label className="field-label" htmlFor="totp-name">
                Name this app <span className="req">*</span>
              </label>
              <input
                id="totp-name"
                type="text"
                className="input"
                maxLength={30}
                placeholder="e.g. iPhone, Authy, 1Password"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
              />
              <div className="hint">Shown in this list, so you can tell which app to remove later.</div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={startEnrolment}
                disabled={busy || !name.trim()}
              >
                <Icons.Plus size={14} /> Add authenticator app
              </button>
              <span className="hint">
                {devices.length === 1 ? '1 app enrolled' : `${devices.length} apps enrolled`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudflareTab({ user, refreshUser }: any) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState<{ accountId: string | null; apiToken: string | null }>({
    accountId: null,
    apiToken: null,
  });
  const [formData, setFormData] = useState({ accountId: '', apiToken: '' });

  useEffect(() => {
    if (user?.hasCloudflareCredentials) fetchCredentials();
  }, [user]);

  const fetchCredentials = async () => {
    try {
      const response = await api.getCloudflareCredentials();
      if (response.success && response.data) {
        setCredentials({
          accountId: response.data.accountId,
          apiToken: response.data.apiToken,
        });
      }
    } catch (error) {
      // Silent fail - credentials might not exist yet
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId.trim()) {
      toast.error('Account ID is required');
      return;
    }
    if (!formData.apiToken.trim()) {
      toast.error('API Token is required');
      return;
    }

    setLoading(true);
    try {
      await api.updateCloudflareCredentials({
        accountId: formData.accountId,
        apiToken: formData.apiToken,
      });
      toast.success('Cloudflare credentials updated successfully');
      await refreshUser();
      await fetchCredentials();
      setEditing(false);
      setFormData({ accountId: '', apiToken: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 28, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative icon */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        opacity: 0.06, pointerEvents: 'none',
      }}>
        <Icons.Cloud size={80} />
      </div>

      <div style={{ position: 'relative' }}>
        <div className="kicker" style={{ marginBottom: 8 }}>// cloudflare integration</div>
        <h2 style={{ fontSize: 22, margin: 0, letterSpacing: '-0.02em', fontWeight: 500 }}>
          API Credentials
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 8, marginBottom: 32, lineHeight: 1.6 }}>
          Your credentials are encrypted with AES-256-CBC and stored securely.
        </p>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Account ID */}
            <div style={{
              padding: 16, background: 'var(--bg-2)',
              border: '1px solid var(--line)', borderRadius: 'var(--radius)',
            }}>
              <div className="kicker" style={{ marginBottom: 8 }}>Account ID</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                {credentials.accountId || 'Not configured'}
              </div>
            </div>

            {/* API Token */}
            <div style={{
              padding: 16, background: 'var(--bg-2)',
              border: '1px solid var(--line)', borderRadius: 'var(--radius)',
            }}>
              <div className="kicker" style={{ marginBottom: 8 }}>API Token</div>
              <div className="mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                {credentials.apiToken ? '••••••••••••••••••••••••' : 'Not configured'}
              </div>
            </div>

            {/* Status indicator */}
            {credentials.accountId && (
              <div style={{
                padding: 16, background: 'var(--bg)',
                border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                display: 'flex', gap: 12, alignItems: 'center',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--green)', boxShadow: '0 0 8px var(--green)',
                }} />
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  Credentials active and encrypted
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                <Icons.Edit size={14} /> {credentials.accountId ? 'Rotate Credentials' : 'Configure Credentials'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Account ID */}
            <div className="field">
              <label className="field-label">
                Cloudflare Account ID <span className="req">*</span>
              </label>
              <input
                type="text"
                className="input input-mono"
                placeholder="32-character hexadecimal account ID"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                disabled={loading}
              />
              <div className="hint">
                Find this in your Cloudflare dashboard under Account → Workers & Pages
              </div>
            </div>

            {/* API Token */}
            <div className="field">
              <label className="field-label">
                Cloudflare API Token <span className="req">*</span>
              </label>
              <input
                type="password"
                className="input input-mono"
                placeholder="Paste your API token here"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                disabled={loading}
              />
              <div className="hint">
                Token must have <span className="mono" style={{ color: 'var(--accent)' }}>{permissionSummary()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 14, height: 14,
                      border: '2px solid currentColor', borderTopColor: 'transparent',
                      borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                    }} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icons.Check size={14} /> Save Credentials
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setEditing(false);
                  setFormData({ accountId: '', apiToken: '' });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          div[style*="padding"] {
            padding: 16px !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
