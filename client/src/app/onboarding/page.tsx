'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Icons } from '@/components/shared/Icons';
import { CLOUDFLARE_PERMISSIONS } from '@/lib/cloudflarePermissions';

type OnboardingMode = 'choose' | 'manual';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [mode, setMode] = useState<OnboardingMode>('choose');
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [formData, setFormData] = useState({ accountId: '', apiToken: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const handleOAuthConnect = async () => {
    setLoading(true);
    try {
      const response = await api.getCloudflareOAuthUrl();
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to generate authorization URL');
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect to Cloudflare');
      setLoading(false);
    }
  };

  // Mirrors server/src/middleware/validators/cloudflareValidators.ts
  const validate = (accountId: string, apiToken: string) => {
    const next: Record<string, string> = {};

    if (!accountId) next.accountId = 'Account ID is required';
    else if (accountId.length !== 32) next.accountId = 'Account ID must be exactly 32 characters';

    if (!apiToken) next.apiToken = 'API token is required';
    else if (apiToken.length < 40) next.apiToken = 'That token looks too short — copy the full value';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const accountId = formData.accountId.trim();
    const apiToken = formData.apiToken.trim();

    if (!validate(accountId, apiToken)) return;

    setLoading(true);
    try {
      await api.saveCloudflareCredentials({ accountId, apiToken });
      toast.success('Cloudflare account connected');
      await refreshUser();
      router.push('/loadbalancers');
    } catch (error: any) {
      toast.error(error.message || 'Could not verify those credentials');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'manual') {
    return (
      <AuthLayout step="connect" onBack={() => setMode('choose')} aside={<TokenGuide />}>
        <form onSubmit={handleManualSubmit}>
          <div className="kicker" style={{ marginBottom: 8 }}>// Step 02 of 03</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 32px)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
            Connect Cloudflare
          </h2>
          <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginTop: 8, marginBottom: 24 }}>
            EdgeBalancer deploys Workers and manages DNS with a scoped token you control. Revoke it any time.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="field">
              <label className="field-label" htmlFor="accountId">
                Account ID<span className="req">*</span>
              </label>
              <input
                id="accountId"
                className="input input-mono"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="a1b2c3d4e5f6…"
                value={formData.accountId}
                aria-invalid={!!errors.accountId}
                onChange={(e) => {
                  setFormData({ ...formData, accountId: e.target.value });
                  if (errors.accountId) setErrors({ ...errors, accountId: '' });
                }}
                disabled={loading}
                style={errors.accountId ? { borderColor: 'var(--red)' } : undefined}
              />
              {errors.accountId ? (
                <p className="hint" style={{ color: 'var(--red)' }}>{errors.accountId}</p>
              ) : (
                <p className="hint">
                  <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent)' }}>dash.cloudflare.com</a>
                  {' '}→ right sidebar → Account ID
                </p>
              )}
            </div>

            <div className="field">
              <label className="field-label" htmlFor="apiToken">
                API Token<span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="apiToken"
                  className="input input-mono"
                  type={showToken ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="••••••••••••••••••••"
                  value={formData.apiToken}
                  aria-invalid={!!errors.apiToken}
                  onChange={(e) => {
                    setFormData({ ...formData, apiToken: e.target.value });
                    if (errors.apiToken) setErrors({ ...errors, apiToken: '' });
                  }}
                  disabled={loading}
                  style={{ paddingRight: 44, ...(errors.apiToken ? { borderColor: 'var(--red)' } : {}) }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-3)',
                  }}>
                  {showToken ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                </button>
              </div>
              {errors.apiToken ? (
                <p className="hint" style={{ color: 'var(--red)' }}>{errors.apiToken}</p>
              ) : (
                <p className="hint">Stored encrypted. Never shown again after saving.</p>
              )}
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ justifyContent: 'center', width: '100%' }}>
              {loading ? 'Verifying with Cloudflare...' : 'Connect account'}
              {!loading && <Icons.Arrow size={14} />}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-3)',
        }}>
          {user?.email ? `Signed in as ${user.email} — ` : ''}
          <button type="button" onClick={handleLogout}
            style={{ color: 'var(--accent)', fontWeight: 500 }}>
            Sign out
          </button>
        </div>
      </AuthLayout>
    );
  }

  // Default: choose mode
  return (
    <AuthLayout step="connect" onBack={() => router.push('/')} aside={<OAuthGuide />}>
      <div className="kicker" style={{ marginBottom: 8 }}>// Step 02 of 03</div>
      <h2 style={{ fontSize: 'clamp(28px, 5vw, 32px)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
        Connect Cloudflare
      </h2>
      <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginTop: 8, marginBottom: 32 }}>
        Authorize EdgeBalancer to manage your Workers and DNS. One click, no API tokens to copy.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleOAuthConnect}
          disabled={loading}
          style={{ justifyContent: 'center', width: '100%', gap: 10 }}
        >
          {loading ? (
            <>
              <div style={{
                width: 16, height: 16,
                border: '2px solid currentColor', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.6s linear infinite',
              }} />
              Redirecting to Cloudflare...
            </>
          ) : (
            <>
              <Icons.Cloud size={18} />
              Connect with Cloudflare
              <Icons.Arrow size={14} />
            </>
          )}
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          color: 'var(--text-3)', fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setMode('manual')}
          disabled={loading}
          style={{ fontSize: 14, color: 'var(--text-3)' }}
        >
          <Icons.Key size={14} />
          Enter API token manually
        </button>
      </div>

      <div style={{
        marginTop: 20, textAlign: 'center',
        fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-3)',
      }}>
        {user?.email ? `Signed in as ${user.email} — ` : ''}
        <button type="button" onClick={handleLogout}
          style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}

function OAuthGuide() {
  return (
    <div style={{ maxWidth: 420 }}>
      <div className="kicker" style={{ marginBottom: 6 }}>// how it works</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Icons.Shield size={15} stroke="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 500 }}>Secure OAuth authorization</span>
      </div>

      <ol style={{
        margin: 0, padding: 0, listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <li style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.55 }}>
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, paddingTop: 2, minWidth: 18 }}>01</span>
          <div style={{ flex: 1 }}>Click <strong style={{ fontWeight: 500 }}>Connect with Cloudflare</strong></div>
        </li>
        <li style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.55 }}>
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, paddingTop: 2, minWidth: 18 }}>02</span>
          <div style={{ flex: 1 }}>You'll be redirected to Cloudflare to review permissions</div>
        </li>
        <li style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.55 }}>
          <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, paddingTop: 2, minWidth: 18 }}>03</span>
          <div style={{ flex: 1 }}>Click <strong style={{ fontWeight: 500 }}>Authorize</strong> — that's it</div>
        </li>
      </ol>

      <div style={{
        marginTop: 20, padding: '12px 14px',
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5,
      }}>
        <strong style={{ color: 'var(--text-2)' }}>No API tokens to copy.</strong>{' '}
        No Account ID to find. EdgeBalancer only requests the permissions it needs — you can revoke access anytime from your Cloudflare dashboard.
      </div>
    </div>
  );
}

function TokenGuide() {
  return (
    <div style={{ maxWidth: 420 }}>
      <div className="kicker" style={{ marginBottom: 6 }}>// create your token</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <Icons.Key size={15} stroke="var(--accent)" />
        <span style={{ fontSize: 15, fontWeight: 500 }}>Six steps in the Cloudflare dashboard</span>
      </div>

      <ol style={{
        margin: 0, padding: 0, listStyle: 'none',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <TokenStep n="01">
          Open{' '}
          <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}>
            the API Tokens page
          </a>
        </TokenStep>
        <TokenStep n="02">
          <strong style={{ fontWeight: 500 }}>Create Token</strong> → <strong style={{ fontWeight: 500 }}>Create Custom Token</strong>
          <span style={{ color: 'var(--text-3)' }}> — do not pick a template</span>
        </TokenStep>
        <TokenStep n="03">
          Name it <span className="mono" style={{ color: 'var(--text-2)' }}>EdgeBalancer</span>
        </TokenStep>
        <TokenStep n="04">
          Add all {CLOUDFLARE_PERMISSIONS.length} permissions:
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {CLOUDFLARE_PERMISSIONS.map((perm) => (
              <div key={`${perm.scope}-${perm.resource}`} style={{
                padding: '8px 10px', borderRadius: 'var(--radius)',
                background: 'var(--bg-2)', border: '1px solid var(--line)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  fontFamily: 'var(--mono)', fontSize: 11,
                }}>
                  <span style={{ color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--text-3)' }}>{perm.scope} · </span>{perm.resource}
                  </span>
                  <span style={{ color: 'var(--accent)' }}>{perm.level}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {perm.why}
                </div>
              </div>
            ))}
          </div>
        </TokenStep>
        <TokenStep n="05">
          Zone Resources → <strong style={{ fontWeight: 500 }}>All zones</strong>, or just the zone you plan to balance
        </TokenStep>
        <TokenStep n="06">
          Continue to summary → Create Token, then copy it immediately
          <span style={{ color: 'var(--red)' }}> — Cloudflare never shows it again</span>
        </TokenStep>
      </ol>

      <div style={{
        marginTop: 20, padding: '12px 14px',
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5,
      }}>
        <Icons.Shield size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
        Your token is encrypted with AES-256-GCM before storage. EdgeBalancer only uses it to manage
        Workers and DNS you configure — nothing else. You can revoke it anytime from the same page.
      </div>
    </div>
  );
}

function TokenStep({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 12, fontSize: 13, lineHeight: 1.55 }}>
      <span className="mono" style={{ color: 'var(--text-3)', fontSize: 11, paddingTop: 2, minWidth: 18 }}>{n}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </li>
  );
}
