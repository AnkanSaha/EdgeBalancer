import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleAuthPanel } from '@/components/auth/GoogleAuthPanel';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import toast from 'react-hot-toast';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ isFirebaseConfigured: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/lib/passkey', () => ({ isPasskeySupported: () => true, authenticateWithPasskey: jest.fn() }));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockConfigured = isFirebaseConfigured as jest.MockedFunction<typeof isFirebaseConfigured>;

const authState = (over: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null,
  loading: false,
  loginWithGoogle: jest.fn().mockResolvedValue({ twoFactorRequired: false, methods: [], preferred: null }),
  verifyTotp: jest.fn().mockResolvedValue(undefined),
  verifyPasskey: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  ...over,
});

beforeEach(() => {
  push.mockClear();
  mockConfigured.mockReturnValue(true);
  mockUseAuth.mockReturnValue(authState());
});

describe('GoogleAuthPanel', () => {
  it('offers Google as the only credential in signin mode', () => {
    render(<GoogleAuthPanel mode="signin" />);
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(document.querySelectorAll('input')).toHaveLength(0);
  });

  it('offers Google as the only credential in signup mode', () => {
    render(<GoogleAuthPanel mode="signup" />);
    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument();
    expect(document.querySelectorAll('input')).toHaveLength(0);
  });

  it('signs in and redirects to overview', async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue({ twoFactorRequired: false, methods: [], preferred: null });
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle }));

    render(<GoogleAuthPanel mode="signin" />);
    await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith('/overview');
  });

  const challenge = (methods: string[], preferred: string | null) =>
    jest.fn().mockResolvedValue({ twoFactorRequired: true, methods, preferred });

  const signIn = async () => {
    render(<GoogleAuthPanel mode="signin" />);
    await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));
  };

  it('lands on the code screen when TOTP is preferred, without touching passkeys', async () => {
    const verifyPasskey = jest.fn();
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['passkey', 'totp'], 'totp'), verifyPasskey }));

    await signIn();

    expect(await screen.findByLabelText('6-digit authentication code')).toBeInTheDocument();
    expect(verifyPasskey).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('fetches the passkey immediately when it is preferred', async () => {
    const verifyPasskey = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['passkey', 'totp'], 'passkey'), verifyPasskey }));

    await signIn();

    expect(await screen.findByText(/Fetching Passkey/i)).toBeInTheDocument();
    await waitFor(() => expect(verifyPasskey).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/overview'));
  });

  it('offers "Try another way" from both methods and switches between them', async () => {
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['passkey', 'totp'], 'totp') }));

    await signIn();
    await screen.findByLabelText('6-digit authentication code');

    await userEvent.click(screen.getByRole('button', { name: /Try another way/i }));
    expect(screen.getByRole('button', { name: /Passkey or security key/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authenticator app code/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Passkey or security key/i }));
    expect(await screen.findByText(/Fetching Passkey/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try another way/i })).toBeInTheDocument();
  });

  it('hides "Try another way" when only one method exists', async () => {
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['totp'], null) }));

    await signIn();
    await screen.findByLabelText('6-digit authentication code');

    expect(screen.queryByRole('button', { name: /Try another way/i })).not.toBeInTheDocument();
  });

  it('falls back to the chooser when the passkey ceremony is cancelled', async () => {
    const verifyPasskey = jest.fn().mockRejectedValue(new Error('Passkey request was cancelled'));
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['passkey', 'totp'], 'passkey'), verifyPasskey }));

    await signIn();

    expect(await screen.findByRole('button', { name: /Authenticator app code/i })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('a complete code verifies and redirects, with no submit button', async () => {
    const verifyTotp = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle: challenge(['totp'], 'totp'), verifyTotp }));

    await signIn();

    const field = await screen.findByLabelText('6-digit authentication code');
    await userEvent.type(field, '123456');

    await waitFor(() => expect(verifyTotp).toHaveBeenCalledWith('123456'));
    expect(push).toHaveBeenCalledWith('/overview');
  });

  // Without a password fallback, an unconfigured Firebase is a dead end — the
  // page has to say so rather than render an empty card.
  it('explains the dead end when Firebase is not configured', () => {
    mockConfigured.mockReturnValue(false);
    render(<GoogleAuthPanel mode="signin" />);

    expect(screen.queryByRole('button', { name: /Google/i })).not.toBeInTheDocument();
    expect(screen.getByText(/isn't configured on this deployment/i)).toBeInTheDocument();
  });

  it('redirects an already-authenticated visitor away', async () => {
    mockUseAuth.mockReturnValue(authState({ user: { id: '1', name: 'Ada', email: 'ada@example.com' } as any }));
    render(<GoogleAuthPanel mode="signin" />);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/overview'));
  });
});
