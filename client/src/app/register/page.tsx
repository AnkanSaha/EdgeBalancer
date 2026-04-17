'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout, GoogleG, Divider } from '@/components/auth/AuthLayout';
import { Icons } from '@/components/shared/Icons';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loginWithGoogle, loading: authLoading } = useAuth();
  const googleAuthEnabled = isFirebaseConfigured();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, router, user]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirm) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.confirm);
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Account created with Google');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-up failed');
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
    <AuthLayout step="register" onBack={() => router.push('/')}>
      <form onSubmit={handleEmailSubmit}>
        <div className="kicker" style={{ marginBottom: 8 }}>// Step 01 of 03</div>
        <h2 style={{ fontSize: 32, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          Create your account
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 8, marginBottom: 24 }}>
          Get started with EdgeBalancer — 14-day free trial.
        </p>

        {googleAuthEnabled && (
          <>
            <button type="button" className="btn btn-dark btn-lg"
              onClick={handleGoogleSignUp}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }}>
              <GoogleG /> Sign up with Google
            </button>

            <Divider label="Email registration" />
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field-label">Full name</label>
            <input className="input" type="text" placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required minLength={8} />
            </div>
            <div className="field">
              <label className="field-label">Confirm</label>
              <input className="input" type="password" placeholder="••••••••"
                value={formData.confirm}
                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                required minLength={8} />
            </div>
          </div>
          {formData.confirm && formData.password !== formData.confirm && (
            <div style={{ fontSize: 12, color: 'var(--red)' }}>Passwords don&apos;t match.</div>
          )}

          <button className="btn btn-primary btn-lg" type="submit"
            disabled={!!formData.confirm && formData.password !== formData.confirm || loading}
            style={{ marginTop: 8, justifyContent: 'center' }}>
            {loading ? 'Creating account...' : 'Create Account'} <Icons.Arrow size={14} />
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
            Already have an account?{' '}
            <button type="button" onClick={() => router.push('/login')}
              style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
