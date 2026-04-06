'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle, loading: authLoading } = useAuth();
  const googleAuthEnabled = isFirebaseConfigured();
  
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // Email form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const validateEmailForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailForm()) return;

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-slate-400 mt-2 font-medium">Sign in to your account</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl transition-all duration-500">
          {/* Google Login */}
          {googleAuthEnabled && (
            <div className="space-y-4">
              <GoogleAuthButton busy={loading} label="Continue with Google" onClick={handleGoogleSignIn} />

              {!showEmailForm && (
                <div className="pt-2 text-center">
                  <button 
                    onClick={() => setShowEmailForm(true)}
                    className="text-[10px] font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Or use email and password
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Email Method */}
          {(!googleAuthEnabled || showEmailForm) && (
            <div className={googleAuthEnabled ? 'mt-8 animate-in fade-in slide-in-from-top-2 duration-500' : ''}>
              {googleAuthEnabled && (
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-slate-900 px-3 text-slate-500 font-bold">Email login</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    placeholder="you@example.com"
                    className="h-12 bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus:border-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={errors.password}
                    placeholder="••••••••"
                    className="h-12 bg-slate-950 border-white/10 text-white placeholder:text-slate-600 focus:border-white transition-all"
                  />
                </div>

                <Button type="submit" className="w-full h-12 font-black bg-white text-black hover:bg-slate-200 transition-all rounded-xl shadow-lg" disabled={loading}>
                  {loading ? 'Processing...' : 'Sign In'}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-slate-400 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-white font-bold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
