'use client';

import { Button } from '@/components/ui/Button';
import { isFirebaseConfigured } from '@/lib/firebase';

interface GoogleAuthButtonProps {
  busy?: boolean;
  label: string;
  onClick: () => Promise<void> | void;
}

export function GoogleAuthButton({ busy = false, label, onClick }: GoogleAuthButtonProps) {
  if (!isFirebaseConfigured()) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-3"
      disabled={busy}
      onClick={() => void onClick()}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.4 14.5 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12Z"
        />
        <path
          fill="#34A853"
          d="M2.6 12c0 2.1.8 4.1 2.2 5.6l3.2-2.5c-.8-.6-1.9-1.9-1.9-3.1s1.1-2.5 1.9-3.1L4.8 6.4C3.4 7.9 2.6 9.9 2.6 12Z"
        />
        <path
          fill="#FBBC05"
          d="M12 21.5c2.5 0 4.6-.8 6.2-2.3l-3-2.3c-.8.6-1.9 1.1-3.2 1.1-2.4 0-4.4-1.6-5.1-3.8l-3.3 2.5c1.6 3 4.7 4.8 8.4 4.8Z"
        />
        <path
          fill="#4285F4"
          d="M18.2 19.2c1.9-1.8 2.8-4.4 2.8-7.3 0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.2 1-.8 2.4-2.2 3.4l3 2.3Z"
        />
      </svg>
      {busy ? 'Please wait...' : label}
    </Button>
  );
}
