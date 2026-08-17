'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Icons } from '@/components/shared/Icons';

interface CTAButtonProps {
  className?: string;
  size?: 'sm' | 'lg';
  style?: React.CSSProperties;
}

/**
 * Client component for CTA buttons that change based on auth state.
 * Shows "Dashboard" when logged in, "Start free" / "Get started" when not.
 */
export function CTAButton({ className = 'btn btn-primary', size = 'lg', style }: CTAButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  if (user) {
    return (
      <button className={`${className} ${size === 'lg' ? 'btn-lg' : 'btn-sm'}`} onClick={() => router.push('/dashboard')} style={style}>
        Go to Dashboard <Icons.Arrow size={size === 'lg' ? 16 : 14} />
      </button>
    );
  }

  return (
    <button className={`${className} ${size === 'lg' ? 'btn-lg' : 'btn-sm'}`} onClick={() => router.push('/register')} style={style}>
      {size === 'lg' ? 'Start free' : 'Deploy your first balancer'} <Icons.Arrow size={size === 'lg' ? 16 : 14} />
    </button>
  );
}

export function SecondaryCTA({ style }: { style?: React.CSSProperties }) {
  const router = useRouter();
  const { user } = useAuth();

  if (user) return null;

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/login')} style={style}>
      Watch a demo
    </button>
  );
}
