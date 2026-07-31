'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { getFirebaseAuth, googleAuthProvider } from '@/lib/firebase';
import type { User } from '@/types/api';
import { signInWithPopup, signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<{ totpRequired: boolean }>;
  verifyTotp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const loginWithGoogle = async (): Promise<{ totpRequired: boolean }> => {
    const auth = getFirebaseAuth();

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();

      const response = await api.googleAuth({ idToken });

      // With 2FA on, Google only earns a challenge — the session comes from verifyTotp.
      if (response.data?.totpRequired) {
        return { totpRequired: true };
      }

      if (!response.success || !response.data?.user) {
        throw new Error(response.message || 'Google sign-in failed');
      }

      setUser(response.data.user);
      return { totpRequired: false };
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

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, verifyTotp, logout, refreshUser }}>
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
}
