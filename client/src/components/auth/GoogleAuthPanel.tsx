'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout, GoogleG } from '@/components/auth/AuthLayout';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

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

export function GoogleAuthPanel({ mode }: { mode: 'signin' | 'signup' }) {
  const router = useRouter();
  const { user, loginWithGoogle, loading: authLoading } = useAuth();
  const copy = COPY[mode];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success(copy.success);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || copy.failure);
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
