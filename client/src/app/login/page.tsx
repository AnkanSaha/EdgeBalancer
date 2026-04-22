'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout, GoogleG, Divider } from '@/components/auth/AuthLayout';
import { Icons } from '@/components/shared/Icons';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle, loading: authLoading } = useAuth();
  const googleAuthEnabled = isFirebaseConfigured();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Signed in with Google');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
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
    <AuthLayout step="signin" onBack={() => router.push('/')}>
      <form onSubmit={handleEmailSubmit}>
        <div className="kicker" style={{ marginBottom: 8 }}>// Welcome back</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 32px)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
          Sign in
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: 'clamp(13px, 2vw, 14px)', marginTop: 8, marginBottom: 24 }}>
          Sign in to your account.
        </p>

        {googleAuthEnabled && (
          <>
            <button type="button" className="btn btn-dark btn-lg"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }}>
              <GoogleG /> Continue with Google
            </button>

            <Divider label="Or use email and password" />
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" placeholder="ada@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input input-mono"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-3)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}>
                {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 8, justifyContent: 'center', width: '100%' }}>
            {loading ? 'Signing in...' : 'Sign in'} <Icons.Arrow size={14} />
          </button>

          <div style={{ textAlign: 'center', fontSize: 'clamp(12px, 2vw, 13px)', color: 'var(--text-3)', marginTop: 8 }}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/register')}
              style={{ color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}>
              Create account
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
