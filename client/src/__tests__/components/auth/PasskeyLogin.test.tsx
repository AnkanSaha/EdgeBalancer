// Renders against the real AuthProvider on purpose: the regression only appears when setUser
// re-renders the provider and hands the panel a fresh verifyPasskey. A mocked useAuth hides it.
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import { GoogleAuthPanel } from '@/components/auth/GoogleAuthPanel';
import toast from 'react-hot-toast';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/lib/firebase', () => ({
  isFirebaseConfigured: () => true,
  getFirebaseAuth: () => ({}),
  googleAuthProvider: {},
  githubAuthProvider: {},
}));
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn().mockResolvedValue({ user: { getIdToken: async () => 'tok' } }),
  signOut: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const authenticateWithPasskey = jest.fn();
jest.mock('@/lib/passkey', () => ({
  isPasskeySupported: () => true,
  authenticateWithPasskey: (...args: any[]) => authenticateWithPasskey(...args),
}));

jest.mock('@/lib/api', () => ({
  api: {
    getCurrentUser: jest.fn().mockRejectedValue(new Error('no session')),
    googleAuth: jest.fn().mockResolvedValue({
      success: true,
      data: { twoFactorRequired: true, methods: ['passkey', 'totp'], preferred: 'passkey' },
    }),
  },
}));

// The challenge cookie is single-use: a repeated ceremony fails with "session expired", which the
// user saw alongside a successful sign-in.
it('runs the passkey ceremony exactly once and reports no error', async () => {
  authenticateWithPasskey
    .mockResolvedValueOnce({ success: true, data: { user: { id: '1', name: 'Ada' } } })
    .mockRejectedValue(new Error('Your sign-in session expired. Start again.'));

  render(<AuthProvider><GoogleAuthPanel mode="signin" /></AuthProvider>);
  await waitFor(() => screen.getByRole('button', { name: /Continue with Google/i }));
  await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));
  await act(() => new Promise((resolve) => setTimeout(resolve, 150)));

  expect(authenticateWithPasskey).toHaveBeenCalledTimes(1);
  expect(toast.error).not.toHaveBeenCalled();
  expect(push).toHaveBeenCalledWith('/overview');
});
