'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-1)',
          color: 'var(--text)',
          border: '1px solid var(--line)',
        },
        success: {
          iconTheme: {
            primary: 'var(--green)',
            secondary: 'var(--bg)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--red)',
            secondary: 'var(--bg)',
          },
        },
      }}
    />
  );
}
