import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleAuthPanel } from '@/components/auth/GoogleAuthPanel';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebase', () => ({ isFirebaseConfigured: jest.fn() }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockConfigured = isFirebaseConfigured as jest.MockedFunction<typeof isFirebaseConfigured>;

const authState = (over: Partial<ReturnType<typeof useAuth>> = {}) => ({
  user: null,
  loading: false,
  loginWithGoogle: jest.fn().mockResolvedValue({ totpRequired: false }),
  verifyTotp: jest.fn().mockResolvedValue(undefined),
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

  it('signs in and redirects to the dashboard', async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue({ totpRequired: false });
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle }));

    render(<GoogleAuthPanel mode="signin" />);
    await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith('/dashboard');
  });

  it('stops at the code screen instead of the dashboard when 2FA is on', async () => {
    const loginWithGoogle = jest.fn().mockResolvedValue({ totpRequired: true });
    mockUseAuth.mockReturnValue(authState({ loginWithGoogle }));

    render(<GoogleAuthPanel mode="signin" />);
    await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    expect(await screen.findByLabelText('6-digit authentication code')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('a complete code verifies and redirects, with no submit button', async () => {
    const verifyTotp = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue(authState({
      loginWithGoogle: jest.fn().mockResolvedValue({ totpRequired: true }),
      verifyTotp,
    }));

    render(<GoogleAuthPanel mode="signin" />);
    await userEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));

    const field = await screen.findByLabelText('6-digit authentication code');
    await userEvent.type(field, '123456');

    await waitFor(() => expect(verifyTotp).toHaveBeenCalledWith('123456'));
    expect(push).toHaveBeenCalledWith('/dashboard');
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
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });
});
