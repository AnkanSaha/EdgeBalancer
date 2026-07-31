'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout, GoogleG } from '@/components/auth/AuthLayout';
import { OtpInput } from '@/components/auth/OtpInput';
import { isFirebaseConfigured } from '@/lib/firebase';
import { Icons } from '@/components/shared/Icons';
import toast from 'react-hot-toast';
import type { SecondFactorMethod } from '@/types/api';

/** Sign-in and sign-up are the same Google popup — the server does find-or-create.
 *  Only the copy differs, so both routes render this. */
const COPY = {
  signin: {
    step: 'signin' as const,
    kicker: '// Welcome back',
    title: 'Sign in',
    subtitle: 'Continue with the Google account you signed up with.',
    cta: 'Continue with Google',
    busy: 'Signing in...',
    success: 'Signed in with Google',
    failure: 'Google sign-in failed',
    altPrompt: "Don't have an account?",
    altLabel: 'Create account',
    altHref: '/register',
  },
  signup: {
    step: 'register' as const,
    kicker: '// Step 01 of 03',
    title: 'Create your account',
    subtitle: 'Sign up with Google — nothing to remember, no credit card.',
    cta: 'Sign up with Google',
    busy: 'Creating account...',
    success: 'Account created with Google',
    failure: 'Google sign-up failed',
    altPrompt: 'Already have an account?',
    altLabel: 'Sign in',
    altHref: '/login',
  },
};

type Stage = null | 'passkey' | 'totp' | 'choose';

export function GoogleAuthPanel({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const { user, loginWithGoogle, verifyTotp, verifyPasskey, loading: authLoading } = useAuth();
  const copy = COPY[mode];
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>(null);
  const [methods, setMethods] = useState<SecondFactorMethod[]>([]);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const finish = () => {
    toast.success(copy.success);
    router.push('/dashboard');
  };

  // Driven by the events that enter the stage, never by an effect watching it: the challenge
  // cookie is single-use, so a second ceremony would fail with an expired-session error.
  const startPasskey = async () => {
    setStage('passkey');
    setLoading(true);
    try {
      await verifyPasskey();
      finish();
    } catch (error: any) {
      toast.error(error.message || 'Passkey sign-in failed');
      setStage('choose');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { twoFactorRequired, methods: available, preferred } = await loginWithGoogle();

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

      finish();
    } catch (error: any) {
      toast.error(error.message || copy.failure);
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (value: string) => {
    setLoading(true);
    setCodeError(false);
    try {
      await verifyTotp(value);
      finish();
    } catch (error: any) {
      toast.error(error.message || 'That code is not valid');
      setCodeError(true);
      setCode('');
    } finally {
      setLoading(false);
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
        <button type="button" onClick={() => setStage('choose')} disabled={loading}
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
              disabled={loading}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, minHeight: 20, fontSize: 13, color: 'var(--text-3)' }}>
              {loading ? (
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

      {/* Google is the only credential, so a missing Firebase config is a dead
          end rather than a fallback to another method — say so plainly. */}
      {isFirebaseConfigured() ? (
        <button type="button" className="btn btn-dark btn-lg"
          onClick={handleGoogle}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}>
          <GoogleG /> {loading ? copy.busy : copy.cta}
        </button>
      ) : (
        <div style={{
          padding: 16, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)', background: 'var(--bg-1)',
          fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
        }}>
          Google sign-in isn&apos;t configured on this deployment. Set the
          {' '}<span className="mono" style={{ color: 'var(--accent)' }}>NEXT_PUBLIC_FIREBASE_*</span>{' '}
          environment variables and reload.
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-3)', marginTop: 20 }}>
        {copy.altPrompt}{' '}
        <button type="button" onClick={() => router.push(copy.altHref)}
          style={{ color: 'var(--accent)', fontWeight: 500 }}>
          {copy.altLabel}
        </button>
      </div>
    </AuthLayout>
  );
}
