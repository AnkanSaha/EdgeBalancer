'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { DeploymentOverlay, DeploymentSuccessModal } from '@/components/loadbalancers/DeploymentExperience';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { LoadBalancerVisualization } from '@/components/loadbalancers/LoadBalancerVisualization';
import { CONTINENTS, COUNTRIES, getCitiesByCountry, getSubdivisionsByCountry, CITIES_BY_SUBDIVISION, getFlagEmoji } from '@/lib/geoData';
import { ALL_CLOUD_REGIONS, REGIONS_BY_PROVIDER } from '@/lib/cloudRegions';
import type { LoadBalancer, LoadBalancerStrategy } from '@/types/api';
import toast from 'react-hot-toast';

const STRATEGIES = [
  { id: 'round-robin', title: 'Round Robin', desc: 'Each request goes to the next server in line, then back to the first.', icon: 'Refresh' },
  { id: 'weighted-round-robin', title: 'Weighted Round Robin', desc: 'Bigger servers get more requests, smaller ones get fewer.', icon: 'Activity' },
  { id: 'ip-hash', title: 'IP Hash', desc: 'Each visitor always lands on the same server, picked from their IP address.', icon: 'Key' },
  { id: 'cookie-sticky', title: 'Sticky Sessions', desc: 'A visitor stays on the same server for their whole visit.', icon: 'Link' },
  { id: 'weighted-cookie-sticky', title: 'Weighted Sticky Sessions', desc: 'Bigger servers get more new visitors, and each visitor then stays put.', icon: 'Layers' },
  { id: 'failover', title: 'Failover', desc: 'Everything goes to your main server. If it fails, the next one takes over.', icon: 'Shield' },
  { id: 'geo-steering', title: 'Geographic Routing', desc: 'Visitors are sent to the server closest to where they are.', icon: 'Globe' },
];

const FREE_STRATEGIES = new Set(['round-robin', 'cookie-sticky', 'ip-hash']);

interface FieldBlockProps {
  n: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const FieldBlock = ({ n, title, subtitle, children }: FieldBlockProps) => (
  <div style={{
    padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-1)',
  }}>
    <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 16px)', marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{
        minWidth: 28, height: 28, borderRadius: 6,
        background: 'var(--accent-dim)', color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--mono)', fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 600,
        border: '1px solid var(--accent)',
        flexShrink: 0,
      }}>{n}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 'clamp(14px, 3vw, 16px)', letterSpacing: '-0.01em', fontWeight: 500 }}>{title}</h3>
        <div style={{ color: 'var(--text-3)', fontSize: 'clamp(12px, 2vw, 13px)', marginTop: 4 }}>{subtitle}</div>
      </div>
    </div>
    <div>{children}</div>
  </div>
);

export default function EditLoadBalancerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState<{ name: string; fullDomain: string } | null>(null);
  const [loadBalancer, setLoadBalancer] = useState<LoadBalancer | null>(null);
  const [form, setForm] = useState({
    subdomain: '',
    origins: [{ id: 1, url: '', weight: 100, rawIp: undefined as string | undefined, healthPath: '/', geoCities: [], geoSubdivisions: [], geoCountries: [], geoContinents: [], isFallback: false }],
    strategy: 'round-robin',
    exposeRealOrigin: false,
    corsEnabled: false,
    corsOrigins: [] as string[],
    healthCheckEnabled: false,
    healthCheckIntervalSeconds: 30,
    rateLimitEnabled: false,
    rateLimitRequestsPerMinute: 60,
    pathRoutes: [] as Array<{ path: string; originIndex: number; priority: number }>,
    pathRateLimits: [] as Array<{ path: string; requestsPerMinute: number; priority: number }>,
    smartPlacement: true,
    placementHint: '',
  });
  const [corsInput, setCorsInput] = useState('');
  const [pathRoutingExpanded, setPathRoutingExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [originViewMode, setOriginViewMode] = useState<Record<number, 'domain' | 'loading' | 'ip'>>({});
  const [originIpCache, setOriginIpCache] = useState<Record<string, string>>({});
  const [restartingOrigin, setRestartingOrigin] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }
    if (params?.id) {
      fetchLoadBalancer(params.id);
    }
  }, [user, router, params]);

  const fetchLoadBalancer = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.getLoadBalancer(id);
      if (response.success && response.data?.loadBalancer) {
        const lb = response.data.loadBalancer;
        setLoadBalancer(lb);
        setForm({
          subdomain: lb.subdomain || '',
          origins: lb.origins.map((o: any, i: number) => ({
            id: i + 1,
            url: o.url,
            weight: o.weight || 100,
            rawIp: undefined as string | undefined,
            healthPath: o.healthPath || '/',
            geoCities: o.geoCities || [],
            geoSubdivisions: o.geoSubdivisions || [],
            geoCountries: o.geoCountries || [],
            geoContinents: o.geoContinents || [],
            isFallback: o.isFallback || false,
          })),
          strategy: lb.strategyValue,
          exposeRealOrigin: lb.exposeRealOrigin ?? false,
          corsEnabled: lb.corsEnabled ?? false,
          corsOrigins: lb.corsOrigins ?? [],
          healthCheckEnabled: lb.healthCheckEnabled ?? false,
          healthCheckIntervalSeconds: lb.healthCheckIntervalSeconds ?? 30,
          rateLimitEnabled: lb.rateLimitEnabled ?? false,
          rateLimitRequestsPerMinute: lb.rateLimitRequestsPerMinute ?? 60,
          pathRoutes: (lb.pathRoutes || []).map((r: any) => ({ path: r.path, originIndex: r.originIndex, priority: r.priority })),
          pathRateLimits: (lb.pathRateLimits || []).map((r: any) => ({ path: r.path, requestsPerMinute: r.requestsPerMinute, priority: r.priority })),
          smartPlacement: lb.placement?.smartPlacement !== false,
          placementHint: lb.placement?.region || '',
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load load balancer');
      router.push('/loadbalancers');
    } finally {
      setLoading(false);
    }
  };

  const restartOrigin = async (originIndex: number) => {
    if (!params?.id) return;
    setRestartingOrigin(originIndex);
    try {
      const response = await api.restartOriginHealth(params.id, originIndex);
      if (response.success) {
        toast.success('Origin queued for health provisioning');
        await fetchLoadBalancer(params.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to restart origin');
    } finally {
      setRestartingOrigin(null);
    }
  };

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCorsToggle = (enabled: boolean) => {
    update('corsEnabled', enabled);
  };

  const addCorsOrigin = (value: string) => {
    const trimmed = value.trim().replace(/\/$/, '');
    if (!trimmed) return;
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!form.corsOrigins.includes(normalized)) {
      update('corsOrigins', [...form.corsOrigins, normalized]);
    }
    setCorsInput('');
  };

  const removeCorsOrigin = (origin: string) => {
    update('corsOrigins', form.corsOrigins.filter(o => o !== origin));
  };

  const redistributeWeights = (origins: typeof form.origins) => {
    const n = origins.length;
    const share = Math.floor(100 / n);
    const remainder = 100 - share * n;
    return origins.map((o, i) => ({ ...o, weight: i < remainder ? share + 1 : share }));
  };

  const addOrigin = () => {
    setForm(f => {
      const newOrigins = [...f.origins, { id: Date.now(), url: '', weight: 1, rawIp: undefined as string | undefined, healthPath: '/', geoCities: [], geoSubdivisions: [], geoCountries: [], geoContinents: [], isFallback: false }];
      return { ...f, origins: redistributeWeights(newOrigins) };
    });
  };

  const isRawIpUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    const hasProto = /^https?:\/\//i.test(url);
    let testUrl = url.trim();
    if (!hasProto) {
      const hostOnly = testUrl.split('/')[0].split('?')[0].split('#')[0];
      const cleanHost = hostOnly.replace(/^\[|\]$/g, '');
      const isIpv6 = cleanHost.includes(':') && /^[a-fA-F0-9:]+$/.test(cleanHost) && (cleanHost.match(/:/g) || []).length >= 2;
      if (isIpv6) {
        const bracketed = hostOnly.startsWith('[') ? hostOnly : `[${hostOnly}]`;
        testUrl = `http://${bracketed}${testUrl.substring(hostOnly.length)}`;
      } else {
        testUrl = `http://${testUrl}`;
      }
    }
    try {
      const { hostname } = new URL(testUrl);
      const cleanHost = hostname.replace(/^\[|\]$/g, '');
      const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(cleanHost);
      const isIpv6 = cleanHost.includes(':') && /^[a-fA-F0-9:]+$/.test(cleanHost) && (cleanHost.match(/:/g) || []).length >= 2;
      return isIpv4 || isIpv6;
    } catch {
      return false;
    }
  };

  const findIpRecord = (url: string) => {
    if (!loadBalancer?.ipOriginRecords?.length || !url.trim()) return null;
    const withProto = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    let hostname = '';
    try { hostname = new URL(withProto).hostname; } catch { return null; }
    return loadBalancer.ipOriginRecords.find(r => r.hostname === hostname) ?? null;
  };

  const showOriginIp = async (originId: number, url: string) => {
    if (!loadBalancer || !params?.id) return;
    const record = findIpRecord(url);
    if (!record) return;
    if (originIpCache[record.hostname]) {
      setOriginViewMode(m => ({ ...m, [originId]: 'ip' }));
      return;
    }
    setOriginViewMode(m => ({ ...m, [originId]: 'loading' }));
    try {
      const res = await api.getOriginIp(params.id, record.hostname);
      if (res.success && res.data?.originalUrl) {
        setOriginIpCache(c => ({ ...c, [record.hostname]: res.data.originalUrl }));
        setOriginViewMode(m => ({ ...m, [originId]: 'ip' }));
      }
    } catch {
      setOriginViewMode(m => ({ ...m, [originId]: 'domain' }));
      toast.error('Could not retrieve original IP');
    }
  };

  const removeOrigin = (id: number) => {
    setForm(f => {
      if (f.origins.length <= 1) return f;
      return { ...f, origins: redistributeWeights(f.origins.filter(s => s.id !== id)) };
    });
  };

  const updateOrigin = (id: number, patch: any) => {
    setForm(f => ({ ...f, origins: f.origins.map(s => s.id === id ? { ...s, ...patch } : s) }));
  };

  const originsValid = form.origins.every(s => s.url.trim().length > 0);
  const allValid = originsValid;

  const fullHost = loadBalancer
    ? (form.subdomain ? `${form.subdomain}.${loadBalancer.domain}` : loadBalancer.domain)
    : '—';

  const deploy = async () => {
    if (!allValid || !loadBalancer || !params?.id) return;

    setDeploying(true);
    try {
      const weightedEnabled = form.strategy === 'weighted-round-robin' || form.strategy === 'weighted-cookie-sticky';
      const trimmedSubdomain = form.subdomain.trim();
      const placementHint = form.placementHint.trim();

      const payload = {
        name: loadBalancer.name,
        zoneId: loadBalancer.zoneId,
        domain: loadBalancer.domain,
        subdomain: trimmedSubdomain || undefined,
        origins: form.origins.map((o) => {
          const url = o.url.trim();
          let finalUrl = url;
          const hasProto = /^https?:\/\//i.test(url);
          const proto = hasProto ? url.match(/^https?:\/\//i)?.[0] ?? 'http://' : 'http://';
          const withoutProto = hasProto ? url.substring(proto.length) : url;
          const hostPart = withoutProto.split('/')[0].split('?')[0].split('#')[0];
          const cleanHost = hostPart.replace(/^\[|\]$/g, '');
          const isIpv6 = cleanHost.includes(':') && /^[a-fA-F0-9:]+$/.test(cleanHost) && (cleanHost.match(/:/g) || []).length >= 2;
          
          if (isIpv6 && !hostPart.startsWith('[')) {
            const rest = withoutProto.substring(hostPart.length);
            finalUrl = `${proto}[${hostPart}]${rest}`;
          } else if (!hasProto) {
            finalUrl = `http://${url}`;
          }
          return {
            url: finalUrl,
            weight: o.weight,
            healthPath: form.healthCheckEnabled ? (o.healthPath?.trim() || '/') : undefined,
            geoCities: o.geoCities || [],
            geoSubdivisions: o.geoSubdivisions || [],
            geoCountries: o.geoCountries || [],
            geoContinents: o.geoContinents || [],
            isFallback: o.isFallback || false,
          };
        }),
        strategy: form.strategy,
        weightedEnabled,
        exposeRealOrigin: form.exposeRealOrigin,
        corsEnabled: form.corsEnabled,
        corsOrigins: form.corsOrigins,
        healthCheckEnabled: form.healthCheckEnabled,
        healthCheckIntervalSeconds: form.healthCheckIntervalSeconds,
        rateLimitEnabled: form.rateLimitEnabled,
        rateLimitRequestsPerMinute: form.rateLimitEnabled ? form.rateLimitRequestsPerMinute : null,
        pathRoutes: form.pathRoutes.length > 0 ? form.pathRoutes : undefined,
        pathRateLimits: form.pathRateLimits.length > 0 ? form.pathRateLimits : undefined,
        placement: {
          smartPlacement: form.smartPlacement,
          ...(placementHint ? { region: placementHint } : {}),
        },
      };

      const operationId = `update-${Date.now()}`;
      const response = await api.updateLoadBalancer(params.id, payload, {
        headers: { 'x-operation-id': operationId },
      });

      if (response.success && response.data?.loadBalancer) {
        setDeploySuccess({
          name: response.data.loadBalancer.name,
          fullDomain: response.data.loadBalancer.fullDomain,
        });
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update load balancer');
    } finally {
      setDeploying(false);
    }
  };

  const showWeights = form.strategy === 'weighted-round-robin' || form.strategy === 'weighted-cookie-sticky';

  if (loading || !loadBalancer) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: 'var(--text-3)' }}>Loading load balancer...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'row' }}>
      <aside style={{
        width: 280, borderRight: '1px solid var(--line)',
        padding: 'clamp(20px, 3vw, 32px)', position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 3vw, 24px)',
        fontSize: 'clamp(12px, 2vw, 13px)',
        overflow: 'auto',
      }} className="hide-md">
        <button onClick={() => router.push('/loadbalancers')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--mono)', fontSize: 'clamp(9px, 2vw, 11px)', color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <Icons.Arrow size={12} style={{ transform: 'rotate(180deg)' }} /> Back to Load Balancers
        </button>

        <div>
          <div className="kicker" style={{ marginBottom: 8, fontSize: 'clamp(9px, 2vw, 11px)' }}>// editing</div>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 3vw, 20px)', letterSpacing: '-0.02em', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loadBalancer.name}
          </h2>
          <div style={{ color: 'var(--text-3)', fontSize: 'clamp(11px, 2vw, 12px)', marginTop: 6, lineHeight: 1.5 }}>
            Update routing strategy, origins, or domain configuration.
          </div>
        </div>

        <div style={{
          padding: 14, border: '1px solid var(--line)', borderRadius: 'var(--radius)',
          background: 'var(--bg-1)',
          fontSize: 'clamp(11px, 2vw, 12px)',
        }}>
          <div className="kicker" style={{ marginBottom: 10, fontSize: 'clamp(9px, 2vw, 11px)' }}>// preview</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(10px, 2vw, 11px)', color: 'var(--text-2)', lineHeight: 1.7 }}>
            <div>name: <span style={{ color: 'var(--accent)' }}>{loadBalancer.name}</span></div>
            <div>host: <span style={{ color: 'var(--accent)' }}>{fullHost}</span></div>
            <div>origins: <span style={{ color: 'var(--accent)' }}>{form.origins.filter(s => s.url).length}</span></div>
            <div>strategy: <span style={{ color: 'var(--accent)' }}>{form.strategy}</span></div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: 14, border: '1px solid var(--line)', borderRadius: 'var(--radius)',
          background: 'var(--bg-1)',
        }}>
          <div className="kicker" style={{ marginBottom: 8, color: 'var(--text-3)' }}>// note</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Worker name cannot be changed after creation. Updates deploy through Worker Versions.
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <Topbar
          crumbs={['Overview', 'Load Balancers', loadBalancer.name]}
          title="Edit Load Balancer"
          subtitle="Configuration changes are promoted through Worker version deployments"
          actions={
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/loadbalancers')}>Cancel</button>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, padding: 'clamp(16px, 4vw, 32px)', overflow: 'auto', flex: 1 }}>
          {/* Form Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)' }}>
          <FieldBlock n={1} title="Hostname"
            subtitle="Leave empty for the bare domain, or enter a subdomain prefix">
            <div className="field">
              <label className="field-label">Subdomain prefix <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
              <div style={{
                display: 'flex', alignItems: 'stretch',
                border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                background: 'var(--bg-1)', overflow: 'hidden',
              }}>
                <input
                  className="input input-mono"
                  placeholder="api"
                  value={form.subdomain}
                  onChange={e => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{ border: 'none', background: 'transparent', flex: 1 }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', padding: '0 16px',
                  fontFamily: 'var(--mono)', fontSize: 13,
                  color: 'var(--text-3)', borderLeft: '1px solid var(--line)',
                  background: 'var(--bg-2)',
                }}>
                  .{loadBalancer.domain}
                </div>
              </div>
              <div className="hint">
                {form.subdomain.trim()
                  ? <><span className="mono" style={{ color: 'var(--accent)' }}>https://{fullHost}</span> — the subdomain will be created automatically</>
                  : <>Uses the bare domain <span className="mono" style={{ color: 'var(--accent)' }}>https://{fullHost}</span></>
                }
              </div>
            </div>
          </FieldBlock>

          <FieldBlock n={2} title="Origin Servers *"
            subtitle="Add, remove, or rebalance the backends that receive traffic here">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadBalancer.ipOriginRecords?.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  background: 'var(--bg-2)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 6 }}>Raw IP origins were auto-converted to internal DNS hostnames</div>
                  {loadBalancer.ipOriginRecords.map(r => (
                    <div key={r.dnsRecordId} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {r.originalUrl} → {r.hostname}
                    </div>
                  ))}
                  <div style={{ marginTop: 6, color: 'var(--text-3)' }}>
                    If you use a reverse proxy, ensure these hostnames are allowed in your <code style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>server_name</code> directive.
                  </div>
                </div>
              )}
              {form.origins.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: showWeights ? '56px minmax(0, 1fr) 110px 40px' : '56px minmax(0, 1fr) 40px',
                    gap: 8, alignItems: 'center',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      height: 44, border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)', background: 'var(--bg-2)',
                      fontFamily: 'var(--mono)', fontSize: 11,
                      color: 'var(--text-3)', textTransform: 'uppercase',
                    }}>#{i + 1}</div>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="input input-mono"
                        placeholder="https://domain.com, http://127.0.0.1, or 192.168.1.100"
                        value={s.url}
                        onChange={e => {
                          const newVal = e.target.value;
                          if (isRawIpUrl(newVal) && !loadBalancer?.domain) {
                            toast.error('Select a domain first — IP origins need a Cloudflare zone for DNS');
                            return;
                          }
                          updateOrigin(s.id, { url: newVal, rawIp: undefined });
                        }}
                      />
                      {isRawIpUrl(s.url) ? (
                        <span
                          style={{
                            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 11, padding: '3px 8px', borderRadius: 4,
                            background: 'var(--bg-3)', border: '1px solid var(--line)',
                            color: 'var(--text-3)', whiteSpace: 'nowrap', fontWeight: 500,
                          }}>
                          DNS auto-created on deploy
                        </span>
                      ) : findIpRecord(s.url) ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (originViewMode[s.id] === 'ip') {
                              setOriginViewMode(m => ({ ...m, [s.id]: 'domain' }));
                            } else {
                              showOriginIp(s.id, s.url);
                            }
                          }}
                          style={{
                            position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 11, padding: '3px 8px', borderRadius: 4,
                            background: 'var(--bg-3)', border: '1px solid var(--line)',
                            color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                          {originViewMode[s.id] === 'loading' ? (
                            <span style={{
                              width: 10, height: 10, border: '2px solid currentColor',
                              borderRightColor: 'transparent', borderRadius: '50%',
                              animation: 'spin 0.7s linear infinite', display: 'inline-block',
                            }} />
                          ) : originViewMode[s.id] === 'ip' ? 'Show Domain' : 'Show IP'}
                        </button>
                      ) : null}
                    </div>
                    {showWeights && (
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input input-mono"
                          type="number" step="1" inputMode="numeric"
                          value={s.weight}
                          onChange={(e) => {
                            if (e.target.value.includes('.')) return;
                            const n = Number.parseInt(e.target.value, 10);
                            updateOrigin(s.id, { weight: Number.isNaN(n) ? '' : n });
                          }}
                          onBlur={(e) => {
                            const n = Number.parseInt(e.target.value, 10);
                            const valid = Number.isNaN(n) || n < 1 ? 1 : Math.min(99, n);
                            setForm(f => ({ ...f, origins: redistributeWeights(f.origins.map(o => o.id === s.id ? { ...o, weight: valid } : o)) }));
                          }}
                          style={{ paddingRight: 32 }}
                        />
                        <span style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
                        }}>wt</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeOrigin(s.id)}
                      disabled={form.origins.length === 1}
                      style={{
                        height: 44, borderRadius: 'var(--radius)',
                        border: '1px solid var(--line)',
                        color: 'var(--text-3)',
                        opacity: form.origins.length === 1 ? 0.3 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>

                  {isRawIpUrl(s.url) && (
                    <div style={{ marginLeft: 64, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
                      A DNS A-record will be created automatically in{' '}
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                        {loadBalancer?.domain || 'your selected domain'}
                      </span>{' '}
                      during deployment. If deployment fails, the DNS record is cleaned up automatically.
                    </div>
                  )}

                  {(() => {
                    const health = loadBalancer?.originHealth?.[i];
                    return (
                      <>
                        {health && (health.status === 'disabled' || health.status === 'provisioning' || health.status === 'unhealthy') && (
                          <div style={{
                            marginLeft: 64, padding: '8px 12px',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--line)',
                            background: 'var(--bg-2)',
                            fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {health.status === 'provisioning' ? (
                                <span style={{
                                  width: 12, height: 12, border: '2px solid var(--accent)',
                                  borderRightColor: 'transparent', borderRadius: '50%',
                                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                                }} />
                              ) : null}
                              <span style={{ color: health.status === 'disabled' ? 'var(--red)' : 'var(--accent)', fontWeight: 500 }}>
                                {health.status === 'disabled' ? 'Disabled' : health.status === 'provisioning' ? 'Origin Provisioning' : 'Unhealthy'}
                              </span>
                              {health.lastStatusCode !== null && health.lastStatusCode !== undefined && (
                                <span style={{ color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                                  status {health.lastStatusCode}
                                </span>
                              )}
                            </div>
                            {health.status === 'disabled' && (
                              <button
                                onClick={() => restartOrigin(i)}
                                disabled={restartingOrigin === i}
                                style={{
                                  fontSize: 11, padding: '3px 10px', borderRadius: 4,
                                  background: 'var(--accent-dim)', color: 'var(--accent)',
                                  border: '1px solid var(--accent)', cursor: 'pointer', fontWeight: 500,
                                  opacity: restartingOrigin === i ? 0.5 : 1,
                                }}
                              >
                                {restartingOrigin === i ? 'Restarting…' : 'Restart'}
                              </button>
                            )}
                          </div>
                        )}
                        {form.healthCheckEnabled && (
                          <div className="field" style={{ marginLeft: 64 }}>
                            <label className="field-label" style={{ fontSize: 11, marginBottom: 6 }}>Health path</label>
                            <input
                              className="input input-mono"
                              placeholder="/health"
                              value={s.healthPath}
                              onChange={e => updateOrigin(s.id, { healthPath: e.target.value })}
                              style={{ fontSize: 12 }}
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {s.rawIp && (() => {
                    const hostname = (() => { try { return new URL(s.url).hostname; } catch { return s.url; } })();
                    const proto = s.url.match(/^https?:\/\//i)?.[0] ?? 'http://';
                    return (
                      <div style={{
                        padding: '10px 14px',
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line)',
                        borderLeft: '3px solid var(--accent)',
                        borderRadius: 'var(--radius)',
                        fontSize: 12,
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>IP converted</span>
                            <span style={{
                              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)',
                              background: 'var(--bg-3)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--line)',
                            }}>{s.rawIp}</span>
                            <span style={{ color: 'var(--text-3)' }}>→</span>
                            <span style={{
                              fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)',
                              background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--accent)',
                            }}>{hostname}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateOrigin(s.id, { url: `${proto}${s.rawIp}`, rawIp: undefined })}
                            style={{
                              fontSize: 11, padding: '3px 10px', borderRadius: 4, flexShrink: 0,
                              background: 'transparent', border: '1px solid var(--line)',
                              color: 'var(--text-3)', cursor: 'pointer',
                            }}>
                            Undo
                          </button>
                        </div>
                        <div style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
                          A grey-cloud DNS A record will be created on save. If you use a reverse proxy, add{' '}
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{hostname}</span>
                          {' '}to your <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>server_name</span>.
                          {' '}If your origin is another load balancer or doesn't use a reverse proxy, no action is needed.
                        </div>
                      </div>
                    );
                  })()}

                  {!s.rawIp && (() => {
                    const rec = findIpRecord(s.url);
                    if (!rec || originViewMode[s.id] !== 'ip') return null;
                    const cachedIp = originIpCache[rec.hostname];
                    if (!cachedIp) return null;
                    return (
                      <div style={{
                        marginLeft: 64, padding: '8px 12px',
                        background: 'var(--bg-2)', border: '1px solid var(--line)',
                        borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      }}>
                        <div>
                          <span style={{ color: 'var(--text-3)' }}>Original IP: </span>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{cachedIp.replace(/^https?:\/\//, '')}</span>
                          <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>→ routed through </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>{rec.hostname}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOriginViewMode(m => ({ ...m, [s.id]: 'domain' }))}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap',
                            background: 'var(--bg-3)', border: '1px solid var(--line)',
                            color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500, flexShrink: 0,
                          }}>
                          Show Domain
                        </button>
                      </div>
                    );
                  })()}

                  {form.strategy === 'geo-steering' && (() => {
                    const selCountries = (s.geoCountries || []) as string[];
                    const selContinents = (s.geoContinents || []) as string[];

                    const availableCountries = selContinents.length > 0
                      ? COUNTRIES.filter(c => selContinents.includes(c.continent))
                      : COUNTRIES;

                    const availableContinents = selCountries.length > 0
                      ? (() => {
                          const codes = new Set(
                            COUNTRIES.filter(c => selCountries.includes(c.code)).map(c => c.continent)
                          );
                          return CONTINENTS.filter(c => (codes as Set<string>).has(c.code));
                        })()
                      : CONTINENTS;

                    const selStates = (s.geoSubdivisions || []) as string[];

                    // Country → States
                    const availableStates = selCountries.flatMap(c => getSubdivisionsByCountry(c));

                    // State → Cities (when states selected, only show their cities; else all country cities)
                    const availableCities = selCountries.flatMap(c => {
                      const allCities = getCitiesByCountry(c);
                      const countryStateCodes = getSubdivisionsByCountry(c).map(st => st.code);
                      const activeStates = selStates.filter(st => countryStateCodes.includes(st));
                      if (activeStates.length > 0 && CITIES_BY_SUBDIVISION[c]) {
                        const validCodes = new Set(activeStates.flatMap(st => CITIES_BY_SUBDIVISION[c][st] || []));
                        return allCities.filter(city => validCodes.has(city.code));
                      }
                      return allCities;
                    });

                    const onContinentsChange = (codes: string[]) => {
                      const validCountries = selCountries.filter(c => {
                        const country = COUNTRIES.find(co => co.code === c);
                        return country && codes.includes(country.continent);
                      });
                      const validStates = selStates.filter(st =>
                        validCountries.some(c => getSubdivisionsByCountry(c).some(x => x.code === st))
                      );
                      const validCities = (s.geoCities || []).filter((city: string) =>
                        validCountries.some(c => getCitiesByCountry(c).some(x => x.code === city))
                      );
                      updateOrigin(s.id, { geoContinents: codes, geoCountries: validCountries, geoSubdivisions: validStates, geoCities: validCities });
                    };

                    const onCountriesChange = (codes: string[]) => {
                      const validStates = selStates.filter(st =>
                        codes.some(c => getSubdivisionsByCountry(c).some(x => x.code === st))
                      );
                      const validCities = (s.geoCities || []).filter((city: string) =>
                        codes.some(c => getCitiesByCountry(c).some(x => x.code === city))
                      );
                      updateOrigin(s.id, { geoCountries: codes, geoSubdivisions: validStates, geoCities: validCities });
                    };

                    const onStatesChange = (codes: string[]) => {
                      const validCities = (s.geoCities || []).filter((city: string) => {
                        for (const countryCode of selCountries) {
                          const allCities = getCitiesByCountry(countryCode);
                          if (!allCities.some(x => x.code === city)) continue;
                          const countryStateCodes = getSubdivisionsByCountry(countryCode).map(st => st.code);
                          const activeStates = codes.filter(st => countryStateCodes.includes(st));
                          if (activeStates.length === 0) return true;
                          const validCodes = new Set(activeStates.flatMap(st => CITIES_BY_SUBDIVISION[countryCode]?.[st] || []));
                          return validCodes.has(city);
                        }
                        return false;
                      });
                      updateOrigin(s.id, { geoSubdivisions: codes, geoCities: validCities });
                    };

                    const toggleFallback = () => {
                      const next = !s.isFallback;
                      setForm(f => ({
                        ...f,
                        origins: f.origins.map(o =>
                          o.id === s.id ? { ...o, isFallback: next } : { ...o, isFallback: false }
                        ),
                      }));
                    };

                    return (
                      <div style={{
                        padding: 12, border: '1px solid var(--line)',
                        borderRadius: 'var(--radius)', background: 'var(--bg-2)',
                        marginLeft: 64,
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
                          Geographic routing for this origin —{' '}
                          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>at least one field required, or mark as fallback</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {/* Row 1: Continent | Country */}
                          <div className="field">
                            <label className="field-label" style={{ fontSize: 11, marginBottom: 6 }}>
                              Continent
                              {selCountries.length > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 4 }}>· filtered by country</span>}
                            </label>
                            <MultiSelect
                              options={availableContinents.map(c => ({ code: c.code, name: c.name }))}
                              value={selContinents}
                              onChange={onContinentsChange}
                              placeholder="Select continents..."
                            />
                          </div>
                          <div className="field">
                            <label className="field-label" style={{ fontSize: 11, marginBottom: 6 }}>
                              Country
                              {selContinents.length > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 4 }}>· filtered by continent</span>}
                            </label>
                            <MultiSelect
                              options={availableCountries.map(c => ({ code: c.code, name: c.name, icon: getFlagEmoji(c.code) }))}
                              value={selCountries}
                              onChange={onCountriesChange}
                              placeholder="Select countries..."
                            />
                          </div>

                          {/* Row 2: State | City (cascade: state filters city) */}
                          <div className="field">
                            <label className="field-label" style={{ fontSize: 11, marginBottom: 6 }}>
                              State / Province
                              {selCountries.length === 0 && <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 4 }}>· select country first</span>}
                            </label>
                            <MultiSelect
                              options={availableStates}
                              value={s.geoSubdivisions || []}
                              onChange={onStatesChange}
                              placeholder={selCountries.length > 0 ? 'Select states...' : 'Select country first...'}
                              disabled={selCountries.length === 0}
                            />
                          </div>
                          <div className="field">
                            <label className="field-label" style={{ fontSize: 11, marginBottom: 6 }}>
                              City
                              {selCountries.length === 0
                                ? <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 4 }}>· select country first</span>
                                : selStates.length > 0
                                  ? <span style={{ color: 'var(--text-3)', fontWeight: 'normal', marginLeft: 4 }}>· filtered by state</span>
                                  : null}
                            </label>
                            <MultiSelect
                              options={availableCities}
                              value={s.geoCities || []}
                              onChange={(codes) => updateOrigin(s.id, { geoCities: codes })}
                              placeholder={selCountries.length > 0 ? 'Select cities...' : 'Select country first...'}
                              disabled={selCountries.length === 0}
                            />
                          </div>
                        </div>

                        <div
                          onClick={toggleFallback}
                          style={{
                            marginTop: 10, padding: '10px 12px',
                            borderRadius: 'var(--radius)',
                            border: `1px solid ${s.isFallback ? 'var(--accent)' : 'var(--line)'}`,
                            background: s.isFallback ? 'var(--accent-dim)' : 'transparent',
                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                            border: `2px solid ${s.isFallback ? 'var(--accent)' : 'var(--line)'}`,
                            background: s.isFallback ? 'var(--accent)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {s.isFallback && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: s.isFallback ? 'var(--accent)' : 'var(--text-2)' }}>
                              Fallback origin
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                              Catches all traffic when no geo rule matches — only one origin can be fallback
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
              <button
                onClick={addOrigin}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '12px', borderRadius: 'var(--radius)',
                  border: '1px dashed var(--line-2)', color: 'var(--text-2)',
                  fontSize: 13,
                }}>
                <Icons.Plus size={14} /> Add Server
              </button>
            </div>
          </FieldBlock>

          <FieldBlock n={3} title="Traffic Strategy *"
            subtitle="Switch how requests are distributed across your origin fleet">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {STRATEGIES.map(s => {
                const Ico = Icons[s.icon as keyof typeof Icons];
                const active = form.strategy === s.id;
                const isSubscribed = user?.isSubscribed;
                const locked = !isSubscribed && !FREE_STRATEGIES.has(s.id);
                return (
                  <button key={s.id}
                    onClick={() => { if (!locked) update("strategy", s.id); }}
                    style={{
                      textAlign: "left", padding: 14,
                      borderRadius: "var(--radius)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                      background: active ? "var(--accent-dim)" : locked ? "var(--bg)" : "var(--bg-2)",
                      display: "flex", gap: 12, alignItems: "flex-start",
                      opacity: locked ? 0.5 : 1,
                      cursor: locked ? "not-allowed" : "pointer",
                      position: "relative",
                    }}>
                    {locked && (
                      <div style={{
                        position: "absolute", top: 8, right: 8,
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 10, color: "var(--accent)", fontFamily: "var(--mono)",
                        fontWeight: 600,
                      }}>
                        <Icons.Lock size={10} /> PRO
                      </div>
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: `1px solid ${active ? "var(--accent)" : "var(--line-2)"}`,
                      background: active ? "oklch(0.80 0.17 70 / 0.25)" : "var(--bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Ico size={14} stroke={active ? "var(--accent)" : "var(--text-2)"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, color: active ? "var(--text)" : "var(--text-2)" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>{s.desc}</div>
                    </div>
                    {!locked && (
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: `1.5px solid ${active ? "var(--accent)" : "var(--line-2)"}`,
                        background: active ? "var(--accent)" : "transparent",
                        flexShrink: 0, marginTop: 2,
                        position: "relative",
                      }}>
                        {active && (
                          <div style={{
                            position: "absolute", inset: 3,
                            borderRadius: "50%", background: "oklch(0.18 0.02 60)",
                          }} />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
                );
            </div>
          </FieldBlock>

          {/* Advanced Settings (Optional) */}
          <div style={{
            border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => setAdvancedExpanded(!advancedExpanded)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '16px 20px', background: 'var(--bg-1)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Advanced Settings</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Placement, health checks, rate limiting, and path-based rules — all optional
                </div>
              </div>
              <span style={{
                fontSize: 18, color: 'var(--text-3)',
                transition: 'transform 0.2s',
                transform: advancedExpanded ? 'rotate(180deg)' : 'none',
              }}>▾</span>
            </button>
            {advancedExpanded && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2vw, 20px)', paddingTop: 20 }}>

          <FieldBlock n={4} title="Traffic Handling"
            subtitle="Control how the load balancer handles requests, CORS, and server placement">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{
                display: 'flex', gap: 14, padding: 16,
                border: `1px solid ${form.exposeRealOrigin ? 'var(--accent)' : 'var(--line)'}`,
                background: form.exposeRealOrigin ? 'var(--accent-dim)' : 'var(--bg-2)',
                borderRadius: 'var(--radius)', cursor: user?.isSubscribed ? 'pointer' : 'not-allowed',
                position: 'relative', opacity: user?.isSubscribed ? 1 : 0.6,
              }}>
                <div style={{
                  width: 36, height: 20, flexShrink: 0,
                  borderRadius: 999,
                  background: form.exposeRealOrigin ? 'var(--accent)' : 'var(--bg-3)',
                  position: 'relative', transition: 'background 160ms',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.exposeRealOrigin ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--bg)', transition: 'left 160ms',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Keep Visitor&apos;s Website Info</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    Say your site is on <span className="mono">apiss.launchd.in</span> (LB) but your API is on <span className="mono">your-origin.com</span>. When the page calls your API, browser sends <span className="mono">Referer: apiss.launchd.in</span> — your API may block it as “not my site”. Leave <strong>off</strong> and we send <span className="mono">your-origin.com</span> instead, so it passes. Turn <strong>on</strong> only if your server needs to know “did this come via my LB?” to allow it.
                  </div>
                </div>
                <input
                  type="checkbox" checked={form.exposeRealOrigin}
                  onChange={e => update('exposeRealOrigin', e.target.checked)}
                  style={{ display: 'none' }}
                />
              </label>

              <label style={{
                display: 'flex', gap: 14, padding: 16,
                border: `1px solid ${form.corsEnabled ? 'var(--accent)' : 'var(--line)'}`,
                background: form.corsEnabled ? 'var(--accent-dim)' : 'var(--bg-2)',
                borderRadius: 'var(--radius)', cursor: user?.isSubscribed ? 'pointer' : 'not-allowed',
                position: 'relative', opacity: user?.isSubscribed ? 1 : 0.6,
                flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 20, flexShrink: 0, marginTop: 2,
                    borderRadius: 999,
                    background: form.corsEnabled ? 'var(--accent)' : 'var(--bg-3)',
                    position: 'relative', transition: 'background 160ms',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: form.corsEnabled ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--bg)', transition: 'left 160ms',
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Handle Cross-Origin Requests</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                      If your frontend (e.g. <span style={{ fontFamily: 'var(--mono)' }}>mysite.com</span>) and backend are on <strong>different domains</strong>, browsers will block requests without CORS headers. Turn this on to let the load balancer handle those checks automatically — so your server code doesn&apos;t need to deal with it.
                    </div>
                  </div>
                  <input
                    type="checkbox" checked={form.corsEnabled}
                    onChange={e => handleCorsToggle(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                </div>
                {form.corsEnabled && (
                  <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 6,
                      border: '1px solid var(--line)', borderRadius: 'var(--radius)',
                      padding: '6px 10px', background: 'var(--bg)',
                      minHeight: 40, alignItems: 'center',
                    }}>
                      {form.corsOrigins.map(origin => (
                        <div key={origin} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'var(--bg-3)', borderRadius: 4,
                          padding: '2px 8px', fontSize: 12,
                        }}>
                          <span>{origin}</span>
                          <button
                            type="button"
                            onClick={() => removeCorsOrigin(origin)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', lineHeight: 1 }}
                          >×</button>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={corsInput}
                        onChange={e => setCorsInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Tab' || e.key === 'Enter') {
                            e.preventDefault();
                            addCorsOrigin(corsInput);
                          }
                        }}
                        onBlur={() => { if (corsInput.trim()) addCorsOrigin(corsInput); }}
                        placeholder="https://yourdomain.com"
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          fontSize: 12, flex: 1, minWidth: 180,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                      Add the domains of your frontend apps that make requests here. Press Tab or Enter to add each one.
                    </div>
                  </div>
                )}
              </label>

              <label style={{
                display: 'flex', gap: 14, padding: 16,
                border: `1px solid ${form.smartPlacement ? 'var(--accent)' : 'var(--line)'}`,
                background: form.smartPlacement ? 'var(--accent-dim)' : 'var(--bg-2)',
                borderRadius: 'var(--radius)', cursor: user?.isSubscribed ? 'pointer' : 'not-allowed',
                position: 'relative', opacity: user?.isSubscribed ? 1 : 0.6,
              }}>
                <div style={{
                  width: 36, height: 20, flexShrink: 0,
                  borderRadius: 999,
                  background: form.smartPlacement ? 'var(--accent)' : 'var(--bg-3)',
                  position: 'relative', transition: 'background 160ms',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.smartPlacement ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--bg)', transition: 'left 160ms',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Optimize for Server Speed</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    By default, the load balancer runs near your <strong>visitors</strong> for the fastest response. Turn this on if your server is slow — the load balancer will move closer to your <strong>server</strong> instead, cutting the round-trip time between them. Good for heavy APIs; skip for static sites.
                    {!user?.isSubscribed && (
                      <span style={{ display: "block", marginTop: 6, color: "var(--accent)", fontWeight: 500 }}>
                        Upgrade to Student or Pro to customize placement.
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox" checked={form.smartPlacement}
                  onChange={e => { if (user?.isSubscribed) update('smartPlacement', e.target.checked); }}
                  style={{ display: 'none' }}
                />
              </label>

              <div className="field">
                <label className="field-label">
                  Pin to a Cloud Region
                  {!form.smartPlacement && <span style={{ color: 'var(--red)', marginLeft: 4 }}>*</span>}
                  {form.smartPlacement && <span style={{ color: 'var(--text-3)', fontWeight: 'normal', fontSize: 11, marginLeft: 4 }}>(disabled when Smart Placement is on)</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={ALL_CLOUD_REGIONS.find(r => r.code === form.placementHint) ? form.placementHint : 'custom'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        update('placementHint', '');
                      } else {
                        update('placementHint', e.target.value);
                      }
                    }}
                    disabled={form.smartPlacement}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      background: form.smartPlacement ? 'var(--bg-3)' : 'var(--bg-1)',
                      color: 'var(--text)',
                      fontSize: 12,
                      fontFamily: 'var(--mono)',
                      cursor: form.smartPlacement ? 'not-allowed' : 'pointer',
                      opacity: form.smartPlacement ? 0.5 : 1,
                      colorScheme: 'dark',
                    }}
                  >
                    <option value="">Choose a region to pin the load balancer to...</option>
                    <optgroup label="AWS">
                      {REGIONS_BY_PROVIDER.aws.map(region => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Google Cloud">
                      {REGIONS_BY_PROVIDER.gcp.map(region => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Azure">
                      {REGIONS_BY_PROVIDER.azure.map(region => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </optgroup>
                    <option value="custom">✏️ Custom (write your own)...</option>
                  </select>
                </div>

                {!form.smartPlacement && form.placementHint === '' && (
                  <input
                    className="input input-mono"
                    placeholder="e.g., aws:us-east-1, gcp:europe-west1, azure:eastus2"
                    value={form.placementHint}
                    onChange={e => update('placementHint', e.target.value)}
                    style={{ marginTop: 8, fontSize: 12 }}
                  />
                )}

                {!ALL_CLOUD_REGIONS.find(r => r.code === form.placementHint) && form.placementHint && (
                  <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>
                    Custom: {form.placementHint}
                  </div>
                )}

                <div className="hint" style={{ marginTop: 4 }}>
                  {form.smartPlacement
                    ? 'Cloudflare automatically positions the Worker near your origins when Smart Placement is enabled.'
                    : 'Required. Choose a cloud region where your origin servers are located, or enter a custom hint.'}
                </div>
              </div>
            </div>
          </FieldBlock>

          <FieldBlock n={5} title="Health Checks"
            subtitle="Continuously probe each origin and stop sending traffic to failed backends">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{
                display: 'flex', gap: 14, padding: 16,
                border: `1px solid ${form.healthCheckEnabled ? 'var(--accent)' : 'var(--line)'}`,
                background: form.healthCheckEnabled ? 'var(--accent-dim)' : 'var(--bg-2)',
                borderRadius: 'var(--radius)', cursor: user?.isSubscribed ? 'pointer' : 'not-allowed',
                position: 'relative', opacity: user?.isSubscribed ? 1 : 0.6,
              }}>
                <div style={{
                  width: 36, height: 20, flexShrink: 0,
                  borderRadius: 999,
                  background: form.healthCheckEnabled ? 'var(--accent)' : 'var(--bg-3)',
                  position: 'relative', transition: 'background 160ms',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.healthCheckEnabled ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--bg)', transition: 'left 160ms',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Enable Health Checks</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    Disabled by default. When enabled, each origin is probed on the interval below.
                  </div>
                </div>
                <input
                  type="checkbox" checked={form.healthCheckEnabled}
                  onChange={e => update('healthCheckEnabled', e.target.checked)}
                  style={{ display: 'none' }}
                />
              </label>

              {form.healthCheckEnabled && (
                <div className="field" style={{ maxWidth: 320 }}>
                  <label className="field-label">Check interval</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="input input-mono"
                      type="number" step="1" inputMode="numeric" min={5} max={3600}
                      value={form.healthCheckIntervalSeconds}
                      onChange={e => {
                        if (e.target.value.includes('.')) return;
                        const n = Number.parseInt(e.target.value, 10);
                        update('healthCheckIntervalSeconds', Number.isNaN(n) ? '' : n);
                      }}
                      onBlur={e => {
                        const n = Number.parseInt(e.target.value, 10);
                        update('healthCheckIntervalSeconds', Number.isNaN(n) || n < 5 ? 5 : Math.min(3600, n));
                      }}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>seconds</span>
                  </div>
                  <div className="hint" style={{ marginTop: 6 }}>
                    After 3 consecutive failures with 2s, 4s, 8s backoff, the origin is disabled.
                  </div>
                </div>
              )}
            </div>
          </FieldBlock>

          <FieldBlock n={6} title="Rate Limiting"
            subtitle="Protect your origins from traffic spikes and abuse by limiting how many requests each visitor can make">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{
                display: 'flex', gap: 14, padding: 16,
                border: `1px solid ${form.rateLimitEnabled ? 'var(--accent)' : 'var(--line)'}`,
                background: form.rateLimitEnabled ? 'var(--accent-dim)' : 'var(--bg-2)',
                borderRadius: 'var(--radius)', cursor: user?.isSubscribed ? 'pointer' : 'not-allowed',
                position: 'relative', opacity: user?.isSubscribed ? 1 : 0.6,
              }}>
                <div style={{
                  width: 36, height: 20, flexShrink: 0,
                  borderRadius: 999,
                  background: form.rateLimitEnabled ? 'var(--accent)' : 'var(--bg-3)',
                  position: 'relative', transition: 'background 160ms',
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.rateLimitEnabled ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--bg)', transition: 'left 160ms',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Global Rate Limit</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                    Caps every visitor at a fixed number of requests per minute across your entire load balancer. This applies to all traffic regardless of which URL path they hit.
                  </div>
                </div>
                <input
                  type="checkbox" checked={form.rateLimitEnabled}
                  onChange={e => update('rateLimitEnabled', e.target.checked)}
                  style={{ display: 'none' }}
                />
              </label>

              {form.rateLimitEnabled && (
                <div className="field" style={{ maxWidth: 320 }}>
                  <label className="field-label">Requests per minute</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="input input-mono"
                      type="number" step="1" inputMode="numeric" min={1} max={100000}
                      value={form.rateLimitRequestsPerMinute}
                      onChange={e => {
                        if (e.target.value.includes('.')) return;
                        const n = Number.parseInt(e.target.value, 10);
                        update('rateLimitRequestsPerMinute', Number.isNaN(n) ? '' : n);
                      }}
                      onBlur={e => {
                        const n = Number.parseInt(e.target.value, 10);
                        update('rateLimitRequestsPerMinute', Number.isNaN(n) || n < 1 ? 1 : Math.min(100000, n));
                      }}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>req / min</span>
                  </div>
                  <div className="hint" style={{ marginTop: 6 }}>
                    Requests are counted per Cloudflare edge location, per visitor IP. Best for abuse prevention.
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Per-Path Rate Limits</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
                  Need tighter limits on specific URL paths? Add rules below. For example, cap <span style={{ fontFamily: 'var(--mono)' }}>/login/*</span> at 10 req/min to slow brute-force attacks, while keeping a higher global limit for everything else.
                  Each rule uses its own separate counter — a visitor can hit the global limit <em>and</em> a path limit independently.
                </div>
                {form.pathRateLimits.map((rl, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      className="input input-mono"
                      placeholder="/login/*"
                      value={rl.path}
                      onChange={e => {
                        const next = [...form.pathRateLimits];
                        next[i] = { ...next[i], path: e.target.value };
                        update('pathRateLimits', next);
                      }}
                      style={{ flex: 2 }}
                    />
                    <input
                      className="input"
                      type="number" min={1} max={100000} placeholder="60"
                      value={rl.requestsPerMinute}
                      onChange={e => {
                        const next = [...form.pathRateLimits];
                        next[i] = { ...next[i], requestsPerMinute: Number(e.target.value) || 60 };
                        update('pathRateLimits', next);
                      }}
                      style={{ width: 100 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>req/min</span>
                    <input
                      className="input"
                      type="number" min={1} placeholder="Priority"
                      value={rl.priority}
                      onChange={e => {
                        const next = [...form.pathRateLimits];
                        next[i] = { ...next[i], priority: Number(e.target.value) || 1 };
                        update('pathRateLimits', next);
                      }}
                      style={{ width: 80 }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => update('pathRateLimits', form.pathRateLimits.filter((_, j) => j !== i))}
                      style={{ padding: '4px 8px', color: 'var(--red)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => update('pathRateLimits', [...form.pathRateLimits, { path: '', requestsPerMinute: 60, priority: form.pathRateLimits.length + 1 }])}
                  style={{ fontSize: 13, marginTop: 4 }}
                >
                  + Add per-path rule
                </button>
              </div>
            </div>
          </FieldBlock>

          {/* Path-Based Routing (Optional) */}
          <div style={{
            border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => setPathRoutingExpanded(!pathRoutingExpanded)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '14px 20px', background: 'var(--bg-1)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Path-Based Routing</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  Optional — route specific URL paths to dedicated origins
                </div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--text-3)', transition: 'transform 0.2s', transform: pathRoutingExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {pathRoutingExpanded && (
              <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', margin: '12px 0' }}>
                  Route specific URL paths to dedicated origins. Requests not matching any rule use the default strategy.
                </div>
                {form.pathRoutes.map((route, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input
                      className="input input-mono"
                      placeholder="/api/*"
                      value={route.path}
                      onChange={e => {
                        const next = [...form.pathRoutes];
                        next[i] = { ...next[i], path: e.target.value };
                        update('pathRoutes', next);
                      }}
                      style={{ flex: 2 }}
                    />
                    <select
                      className="input"
                      value={route.originIndex}
                      onChange={e => {
                        const next = [...form.pathRoutes];
                        next[i] = { ...next[i], originIndex: Number(e.target.value) };
                        update('pathRoutes', next);
                      }}
                      style={{ flex: 2 }}
                    >
                      {form.origins.map((o, idx) => (
                        <option key={idx} value={idx}>Origin {idx + 1}: {o.url || '(empty)'}</option>
                      ))}
                    </select>
                    <input
                      className="input"
                      type="number" min={1} placeholder="Priority"
                      value={route.priority}
                      onChange={e => {
                        const next = [...form.pathRoutes];
                        next[i] = { ...next[i], priority: Number(e.target.value) || 1 };
                        update('pathRoutes', next);
                      }}
                      style={{ width: 80 }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => update('pathRoutes', form.pathRoutes.filter((_, j) => j !== i))}
                      style={{ padding: '4px 8px', color: 'var(--red)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    const hasOrigin = form.origins.some(o => o.url.trim().length > 0);
                    if (!hasOrigin) {
                      toast.error('Add at least one origin server before creating path rules');
                      return;
                    }
                    update('pathRoutes', [...form.pathRoutes, { path: '', originIndex: 0, priority: form.pathRoutes.length + 1 }]);
                  }}
                  style={{ fontSize: 13, marginTop: 4 }}
                >
                  + Add path rule
                </button>
              </div>
            )}
          </div>

              </div>
            )}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-1)',
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>
              {allValid ? (
                <><span style={{ color: 'var(--green)' }}>✓</span> Ready to deploy update</>
              ) : (
                <>Complete required fields to deploy</>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => router.push('/loadbalancers')}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!allValid || deploying}
                onClick={deploy}
                style={{ opacity: (!allValid || deploying) ? 0.5 : 1 }}>
                {deploying ? (
                  <>
                    <span style={{
                      width: 14, height: 14, border: '2px solid currentColor',
                      borderRightColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Updating…
                  </>
                ) : (
                  <>
                    <Icons.Check size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
          </div>

          {/* Visualization Column */}
          <div className="visualization-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <LoadBalancerVisualization
              domain={loadBalancer?.domain}
              subdomain={form.subdomain}
              strategy={form.strategy as LoadBalancerStrategy}
              originCount={form.origins.filter(o => o.url.trim()).length}
              isGeoSteering={form.strategy === 'geo-steering' && form.origins.some(o =>
                (o.geoCountries && o.geoCountries.length > 0) ||
                (o.geoContinents && o.geoContinents.length > 0)
              )}
            />
          </div>
        </div>

        <DeploymentOverlay
          isOpen={deploying}
          mode="edit"
          targetName={loadBalancer.name}
          onCancel={() => {}}
          cancelRequested={false}
          cancellable={false}
        />

        <DeploymentSuccessModal
          isOpen={!!deploySuccess}
          mode="edit"
          name={deploySuccess?.name || loadBalancer.name}
          fullDomain={deploySuccess?.fullDomain || fullHost}
          onContinue={() => router.push('/loadbalancers')}
        />
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          .hide-md { display: none; }
          .visualization-panel { display: none !important; }
          main {
            padding: 16px !important;
          }
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .deploy-actions {
            flex-direction: column;
            width: 100%;
          }
          .deploy-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
