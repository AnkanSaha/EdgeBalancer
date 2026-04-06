'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loginWithGoogle, loading: authLoading } = useAuth();
  const googleAuthEnabled = isFirebaseConfigured();
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [authLoading, router, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.confirmPassword);
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
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground mt-2">Get started with EdgeBalancer</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm transition-all duration-300">
          {googleAuthEnabled && (
            <div className="space-y-4">
              <GoogleAuthButton busy={loading} label="Sign up with Google" onClick={handleGoogleSignUp} />

              {!showEmailForm && (
                <div className="pt-2 text-center">
                  <button 
                    onClick={() => setShowEmailForm(true)}
                    className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Or continue with email
                  </button>
                </div>
              )}
            </div>
          )}

          {(!googleAuthEnabled || showEmailForm) && (
            <div className={googleAuthEnabled ? 'mt-8 animate-in fade-in slide-in-from-top-2 duration-500' : ''}>
              {googleAuthEnabled && (
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-card px-3 text-muted-foreground font-bold">Email registration</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    error={errors.name}
                    placeholder="John Doe"
                    autoComplete="name"
                    className="h-12 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 focus:border-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    error={errors.email}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-12 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 focus:border-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" senior-level text-xs font-black text-slate-500 uppercase tracking-widest mb-2>
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      error={errors.password}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="h-12 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 focus:border-white transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" senior-level text-xs font-black text-slate-500 uppercase tracking-widest mb-2>
                      Confirm
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      error={errors.confirmPassword}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="h-12 bg-slate-950 border-white/20 text-white placeholder:text-slate-500 focus:border-white transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 font-bold bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
