'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout, GoogleG, GithubMark, Divider } from '@/components/auth/AuthLayout';
import { OtpInput } from '@/components/auth/OtpInput';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Icons } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import type { SecondFactorMethod } from '@/types/api';

const COPY = {
  step: 'signin' as const,
  kicker: '// Get started',
  title: 'Sign in or create an account',
  subtitle: 'Continue with Google or GitHub — your account is created automatically.',
  cta: 'Continue with Google',
  ctaGithub: 'Continue with GitHub',
  busy: 'Signing in with Google...',
  busyGithub: 'Signing in with GitHub...',
  success: 'Signed in with Google',
  successGithub: 'Signed in with GitHub',
  failure: 'Google sign-in failed',
  failureGithub: 'GitHub sign-in failed',
};

type Stage = null | 'passkey' | 'totp' | 'choose';
type Busy = 'google' | 'github' | 'passkey' | 'totp' | null;

export function GoogleAuthPanel() {
  const router = useRouter();
  const { user, loginWithGoogle, loginWithGitHub, verifyTotp, verifyPasskey, loading: authLoading } = useAuth();
  const copy = COPY;
  const [busy, setBusy] = useState<Busy>(null);
  const [stage, setStage] = useState<Stage>(null);
  const [methods, setMethods] = useState<SecondFactorMethod[]>([]);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/overview');
    }
  }, [user, authLoading, router]);

  const finish = (message: string) => {
    toast.success(message);
    router.push('/overview');
  };

  // Driven by the events that enter the stage, never by an effect watching it: the challenge
  // cookie is single-use, so a second ceremony would fail with an expired-session error.
  const startPasskey = async () => {
    setStage('passkey');
    setBusy('passkey');
    try {
      await verifyPasskey();
      finish('Signed in');
    } catch (error: any) {
      toast.error(error.message || 'Passkey sign-in failed');
      setStage('choose');
    } finally {
      setBusy(null);
    }
  };

  const handleLogin = async (provider: 'google' | 'github', login: () => Promise<{ twoFactorRequired: boolean; methods: SecondFactorMethod[]; preferred: SecondFactorMethod | null }>, success: string, failure: string) => {
    setBusy(provider);
    try {
      const { twoFactorRequired, methods: available, preferred } = await login();

      if (twoFactorRequired) {
        setMethods(available);
        const next = preferred && available.includes(preferred)
          ? preferred
          : available.length === 1 ? available[0] : 'choose';

        if (next === 'passkey') {
          await startPasskey();
        } else {
          setStage(next);
        }
        return;
      }

      finish(success);
    } catch (error: any) {
      toast.error(error.message || failure);
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = () => handleLogin('google', loginWithGoogle, copy.success, copy.failure);
  const handleGitHub = () => handleLogin('github', loginWithGitHub, copy.successGithub, copy.failureGithub);

  const handleCode = async (value: string) => {
    setBusy('totp');
    setCodeError(false);
    try {
      await verifyTotp(value);
      finish('Signed in');
    } catch (error: any) {
      toast.error(error.message || 'That code is not valid');
      setCodeError(true);
      setCode('');
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) {
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

  if (stage) {
    const tryAnotherWay = methods.length > 1 && (
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button type="button" onClick={() => setStage('choose')} disabled={busy !== null}
          style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 13 }}>
          Try another way
        </button>
      </div>
    );

    return (
      <AuthLayout step="signin" onBack={() => { setStage(null); setMethods([]); }}>
        <div className="kicker" style={{ marginBottom: 8 }}>// Step 02 of 02</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 32px)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          {stage === 'passkey' ? 'Fetching Passkey' : stage === 'totp' ? 'Two-factor code' : 'Choose a method'}
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginTop: 8, marginBottom: 28 }}>
          {stage === 'passkey'
            ? 'Confirm with your passkey, security key or password manager.'
            : stage === 'totp'
              ? 'Enter the 6-digit code from any of your authenticator apps.'
              : 'How would you like to confirm it is you?'}
        </p>

        {stage === 'passkey' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '16px 0' }}>
            <div style={{
              width: 48, height: 48,
              border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
              borderRadius: '50%', animation: 'spin 0.9s linear infinite',
            }} />
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Waiting for your authenticator...</div>
          </div>
        )}

        {stage === 'totp' && (
          <>
            <OtpInput
              value={code}
              onChange={(value) => { setCode(value); if (codeError) setCodeError(false); }}
              onComplete={handleCode}
              error={codeError}
              disabled={busy !== null}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, minHeight: 20, fontSize: 13, color: 'var(--text-3)' }}>
              {busy !== null ? (
                <>
                  <div style={{
                    width: 14, height: 14,
                    border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
                    borderRadius: '50%', animation: 'spin 0.6s linear infinite',
                  }} />
                  Verifying...
                </>
              ) : (
                <><Icons.Lock size={12} /> The code changes every 30 seconds</>
              )}
            </div>
          </>
        )}

        {stage === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {methods.map((method) => (
              <button key={method} type="button" className="btn btn-dark btn-lg"
                onClick={() => (method === 'passkey' ? startPasskey() : setStage('totp'))}
                style={{ width: '100%', justifyContent: 'flex-start', gap: 12 }}>
                {method === 'passkey' ? <Icons.Key size={16} /> : <Icons.Lock size={16} />}
                {method === 'passkey' ? 'Passkey or security key' : 'Authenticator app code'}
              </button>
            ))}
          </div>
        )}

        {stage !== 'choose' && tryAnotherWay}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout step={copy.step} onBack={() => router.push('/')}>
      <div className="kicker" style={{ marginBottom: 8 }}>{copy.kicker}</div>
      <h2 style={{ fontSize: 'clamp(28px, 5vw, 32px)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
        {copy.title}
      </h2>
      <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginTop: 8, marginBottom: 24 }}>
        {copy.subtitle}
      </p>

      {/* Google and GitHub are the only credentials, so a missing Firebase config is a dead
          end rather than a fallback to another method — say so plainly. */}
      {isFirebaseConfigured() ? (
        <>
          <button type="button" className="btn btn-dark btn-lg"
            onClick={handleGoogle}
            disabled={busy !== null}
            style={{ width: '100%', justifyContent: 'center' }}>
            <GoogleG /> {busy === 'google' ? copy.busy : copy.cta}
          </button>

          <Divider label="or" />

          <button type="button" className="btn btn-dark btn-lg"
            onClick={handleGitHub}
            disabled={busy !== null}
            style={{ width: '100%', justifyContent: 'center' }}>
            <GithubMark /> {busy === 'github' ? copy.busyGithub : copy.ctaGithub}
          </button>
        </>
      ) : (
        <div style={{
          padding: 16, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)', background: 'var(--bg-1)',
          fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          Sign-in isn&apos;t configured on this deployment. Set the
          {' '}<span className="mono" style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_FIREBASE_*</span>{' '}
          environment variables and reload.
        </div>
      )}
    </AuthLayout>
  );
}
