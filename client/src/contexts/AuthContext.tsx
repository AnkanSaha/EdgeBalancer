'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { getFirebaseAuth, googleAuthProvider } from '@/lib/firebase';
import type { SecondFactorMethod, User } from '@/types/api';
import { authenticateWithPasskey } from '@/lib/passkey';
import { signInWithPopup, signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<TwoFactorChallenge>;
  verifyTotp: (code: string) => Promise<void>;
  verifyPasskey: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface TwoFactorChallenge {
  twoFactorRequired: boolean;
  methods: SecondFactorMethod[];
  preferred: SecondFactorMethod | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginWithGoogle = async (): Promise<TwoFactorChallenge> => {
    const auth = getFirebaseAuth();

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.googleAuth({ idToken });

      // With 2FA on, Google only earns a challenge — the session comes from a second factor.
      if (response.data?.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          methods: response.data.methods || [],
          preferred: response.data.preferred ?? null,
        };
      }

      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Google sign-in failed');
      }

      setUser(response.data.user);
      return { twoFactorRequired: false, methods: [], preferred: null };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      await signOut(auth);
    }
  };

  const verifyTotp = async (code: string) => {
    const response = await api.verifyTotp({ code });

    if (!response.success || !response.data?.user) {
      throw new Error(response.message || 'Verification failed');
    }

    setUser(response.data.user);
  };

  const verifyPasskey = async () => {
    const response = await authenticateWithPasskey();

    if (!response.success || !response.data?.user) {
      throw new Error(response.message || 'Verification failed');
    }

    setUser(response.data.user);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, verifyTotp, verifyPasskey, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};