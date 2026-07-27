'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Icons } from '@/components/shared/Icons';
import { CLOUDFLARE_PERMISSIONS } from '@/lib/cloudflarePermissions';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
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

  // Mirrors server/src/middleware/validators/cloudflareValidators.ts so a bad
  // paste surfaces inline instead of as a round-trip toast.
  const validate = (accountId: string, apiToken: string) => {
    const next: Record<string, string> = {};

    if (!accountId) next.accountId = 'Account ID is required';
    else if (accountId.length !== 32) next.accountId = 'Account ID must be exactly 32 characters';

    if (!apiToken) next.apiToken = 'API token is required';
    else if (apiToken.length < 40) next.apiToken = 'That token looks too short — copy the full value';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Pasted tokens routinely carry trailing whitespace; the server encrypts
    // req.body as-is, so trim before it ever leaves the client.
    const accountId = formData.accountId.trim();
    const apiToken = formData.apiToken.trim();

    if (!validate(accountId, apiToken)) return;

    setLoading(true);
    try {
      await api.saveCloudflareCredentials({ accountId, apiToken });
      toast.success('Cloudflare account connected');
      await refreshUser();
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Could not verify those credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout step="connect" onBack={() => router.push('/')} aside={<TokenGuide />}>
      <form onSubmit={handleSubmit}>
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
          {/* Counted from the list so the copy can never drift out of step with it again. */}
          Add all {CLOUDFLARE_PERMISSIONS.length} permissions:
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {CLOUDFLARE_PERMISSIONS.map(([scope, resource, level]) => (
              <div key={`${scope}-${resource}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                padding: '7px 10px', borderRadius: 'var(--radius)',
                background: 'var(--bg-2)', border: '1px solid var(--line)',
                fontFamily: 'var(--mono)', fontSize: 11,
              }}>
                <span style={{ color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--text-3)' }}>{scope} · </span>{resource}
                </span>
                <span style={{ color: 'var(--accent)' }}>{level}</span>
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
