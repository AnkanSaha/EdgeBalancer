import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateLoadBalancerPage from '@/app/loadbalancers/create/page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ api: { getCloudflareZones: jest.fn(), createLoadBalancer: jest.fn() } }));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/components/dashboard/Sidebar', () => ({
  Sidebar: () => null,
  Topbar: ({ actions }: any) => <div data-testid="topbar">{actions}</div>,
}));

jest.mock('@/components/loadbalancers/DeploymentExperience', () => ({
  DeploymentOverlay: () => null,
  DeploymentSuccessModal: () => null,
}));

jest.mock('@/components/ui/MultiSelect', () => ({ MultiSelect: () => null }));

jest.mock('@/components/loadbalancers/LoadBalancerVisualization', () => ({
  LoadBalancerVisualization: () => null,
}));

jest.mock('@/lib/geoData', () => ({
  CONTINENTS: [],
  COUNTRIES: [],
  getCitiesByCountry: jest.fn().mockReturnValue([]),
  getSubdivisionsByCountry: jest.fn().mockReturnValue([]),
  CITIES_BY_SUBDIVISION: {},
  getFlagEmoji: jest.fn().mockReturnValue(''),
}));

jest.mock('@/lib/cloudRegions', () => ({
  ALL_CLOUD_REGIONS: [],
  REGIONS_BY_PROVIDER: { aws: [], gcp: [], azure: [] },
}));

jest.mock('@/components/shared/Icons', () => ({
  Icons: new Proxy({}, { get: () => () => null }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockApi = api as jest.Mocked<typeof api>;

const AUTHED_USER = {
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
  username: 'alice',
  hasCloudflareCredentials: true,
};

beforeEach(() => {
  mockUseRouter.mockReturnValue({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() } as any);
  mockUseAuth.mockReturnValue({ user: AUTHED_USER, loading: false, logout: jest.fn() } as any);
  mockApi.getCloudflareZones.mockResolvedValue({ success: true, data: { zones: [] }, message: 'ok' });
});

async function openAdvancedSettings() {
  await waitFor(() => screen.getByText('Advanced Settings'));
  fireEvent.click(screen.getByText('Advanced Settings'));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CreateLoadBalancerPage — Keep Visitor Website Info toggle', () => {
  it('renders the "Keep Visitor Website Info" label after expanding Advanced Settings', async () => {
    render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() => expect(screen.getByText(/Keep Visitor/i)).toBeInTheDocument());
  });

  it('renders the toggle description text', async () => {
    render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() =>
      expect(screen.getByText(/come via my LB/i)).toBeInTheDocument()
    );
  });

  it('checkbox defaults to checked (exposeRealOrigin: true)', async () => {
    const { container } = render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() => screen.getByText(/Keep Visitor/i));

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const exposeCheckbox = Array.from(checkboxes).find(
      cb => cb.closest('label')?.textContent?.includes('Keep Visitor')
    );
    expect(exposeCheckbox).toBeDefined();
    expect(exposeCheckbox?.checked).toBe(true);
  });

  it('unchecking the toggle sets exposeRealOrigin: false', async () => {
    const { container } = render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() => screen.getByText(/Keep Visitor/i));

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const exposeCheckbox = Array.from(checkboxes).find(
      cb => cb.closest('label')?.textContent?.includes('Keep Visitor')
    )!;

    fireEvent.change(exposeCheckbox, { target: { checked: false } });
    await waitFor(() => expect(exposeCheckbox.checked).toBe(false));
  });
});

// ─── CORS toggle ──────────────────────────────────────────────────────────────

describe('CreateLoadBalancerPage — Handle Cross-Origin Requests toggle', () => {
  it('renders the "Handle Cross-Origin Requests" label after expanding Advanced Settings', async () => {
    render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() => expect(screen.getByText('Handle Cross-Origin Requests')).toBeInTheDocument());
  });

  it('CORS toggle checkbox defaults to unchecked (corsEnabled: false)', async () => {
    const { container } = render(<CreateLoadBalancerPage />);
    await openAdvancedSettings();
    await waitFor(() => screen.getByText('Handle Cross-Origin Requests'));

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    const corsCheckbox = Array.from(checkboxes).find(cb =>
      cb.closest('label')?.textContent?.includes('Handle Cross-Origin')
    );
    expect(corsCheckbox).toBeDefined();
    expect(corsCheckbox?.checked).toBe(false);
  });
});
