'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCloudflare?: boolean;
}

export function ProtectedRoute({ children, requireCloudflare = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireCloudflare && !user.hasCloudflareCredentials) {
        router.push('/onboarding');
      }
    }
  }, [user, loading, requireCloudflare, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireCloudflare && !user.hasCloudflareCredentials)) {
    return null;
  }

  return <>{children}</>;
}
