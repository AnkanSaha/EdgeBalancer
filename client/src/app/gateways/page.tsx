'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { Icons } from '@/components/shared/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { PauseModal } from '@/components/loadbalancers/PauseModal';
import type { Gateway } from '@/types/api';
import toast from 'react-hot-toast';

function GatewayCard({ gw, onSelect, onDelete, onPause, onResume, isDeleting, isActioning }: {
  gw: Gateway; onSelect: () => void; onDelete: () => void; onPause: () => void; onResume: () => void; isDeleting?: boolean; isActioning?: boolean;
}) {
  const statusClass = gw.status === 'active' ? 'live' : gw.status === 'paused' ? 'warn' : '';
  return (
    <div onClick={onSelect} className="feature-card feature-card-lift" style={{ textAlign: 'left', width: '100%', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className={`chip ${statusClass}`}>{gw.status}</span>
            {gw.canary?.enabled && <span className="chip" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>canary {gw.canary.percentage}%</span>}
            {gw.jwtAuthEnabled && <span className="chip" style={{ background: 'oklch(0.6 0.15 230 / 0.12)', color: '#3b82f6' }}>JWT</span>}
            {gw.cacheConfig?.enabled && <span className="chip" style={{ background: 'oklch(0.65 0.12 150 / 0.12)', color: '#10b981' }}>cache</span>}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{gw.name}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{gw.fullDomain}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {gw.status === 'active' ? (
            <button className="btn btn-ghost btn-sm" disabled={isActioning} onClick={onPause}><Icons.Log size={12} /> Pause</button>
          ) : gw.status === 'paused' ? (
            <button className="btn btn-ghost btn-sm" disabled={isActioning} onClick={onResume}><Icons.Activity size={12} /> Resume</button>
          ) : null}
          <button className="btn btn-ghost btn-sm" onClick={onSelect}><Icons.Edit size={12} /> Edit</button>
          <button className="btn btn-ghost btn-sm" disabled={isDeleting} onClick={onDelete} style={{ color: 'var(--red)' }}><Icons.Trash size={12} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        {[
          { l: 'Upstreams', v: gw.upstreams?.length ?? 0 },
          { l: 'Routes', v: gw.pathRoutes?.length ?? 0 },
          { l: 'Mocks', v: gw.mockRoutes?.length ?? 0 },
        ].map((s, i) => (
          <div key={i}>
            <div className="kicker" style={{ fontSize: 10 }}>{s.l}</div>
            <div className="mono" style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
        {gw.upstreams?.map((u) => u.url).join(', ') || '—'}
      </div>
    </div>
  );
}

function EmptyGateways({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 48, border: '1px dashed var(--line-2)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-1)' }}>
      <div style={{ width: 64, height: 64, margin: '0 auto 24px', borderRadius: 'var(--radius)', border: '1px solid var(--line-2)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icons.Globe size={24} stroke="var(--accent)" />
      </div>
      <h2 style={{ fontSize: 20, margin: 0, letterSpacing: '-0.02em' }}>No gateways yet</h2>
      <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>Create an API gateway to route, authenticate and cache traffic at the edge.</p>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onCreate}><Icons.Plus size={14} /> Create gateway</button>
    </div>
  );
}

export default function GatewaysPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState<{ isOpen: boolean; gw: Gateway | null }>({ isOpen: false, gw: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; gw: Gateway | null }>({ isOpen: false, gw: null });
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | undefined>(undefined);

  const fetchGateways = useCallback(async () => {
    try {
      const res = await api.getGateways();
      if (res.success) setGateways(res.data?.gateways ?? []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch gateways');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!user.hasCloudflareCredentials && !user.cloudflareOAuthConnected) { router.push('/onboarding'); return; }
    fetchGateways();
  }, [authLoading, user, router, fetchGateways]);

  const handleNav = (id: string) => {
    if (id === 'overview') router.push('/overview');
    else if (id === 'balancers') router.push('/loadbalancers');
    else if (id === 'gateways') router.push('/gateways');
    else if (id === 'sessions') router.push('/sessions');
    else if (id === 'ai-runs') router.push('/ai-runs');
    else if (id === 'pro') router.push('/pro');
    else if (id === 'payments') router.push('/payments');
    else if (id === 'settings') router.push('/settings');
  };

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const handleDelete = async () => {
    if (!deleteModal.gw) return;
    setDeletingId(deleteModal.gw.id);
    try {
      await api.deleteGateway(deleteModal.gw.id);
      toast.success('Gateway deleted');
      setDeleteModal({ isOpen: false, gw: null });
      fetchGateways();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePause = async (mode: 'release-domain' | 'keep-domain') => {
    if (!pauseModal.gw) return;
    setActioningId(pauseModal.gw.id);
    try {
      await api.pauseGateway(pauseModal.gw.id, mode);
      toast.success('Gateway paused');
      setPauseModal({ isOpen: false, gw: null });
      fetchGateways();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to pause');
    } finally {
      setActioningId(null);
    }
  };

  const handleResume = async (gw: Gateway) => {
    setActioningId(gw.id);
    try {
      await api.resumeGateway(gw.id);
      toast.success('Gateway resumed');
      fetchGateways();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to resume');
    } finally {
      setActioningId(null);
    }
  };

  const filtered = gateways.filter((gw) => {
    if (statusFilter && gw.status !== statusFilter) return false;
    if (searchValue.trim()) {
      const q = searchValue.trim().toLowerCase();
      if (!gw.name.toLowerCase().includes(q) && !gw.fullDomain.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mono" style={{ color: 'var(--text-3)' }}>Loading gateways…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column' }}>
      <div className="app-shell">
        <Sidebar current="gateways" onNav={handleNav} onLogout={handleLogout} userEmail={user?.email} hasCloudflareCredentials={user?.hasCloudflareCredentials} cloudflareOAuthConnected={user?.cloudflareOAuthConnected} isReady={!!user?.hasCloudflareCredentials} isPro={user?.isPro} plan={user?.plan} planExpiresAt={user?.planExpiresAt} />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar crumbs={['Gateways']} title="API Gateways" subtitle="Route, authenticate and cache traffic at the edge" actions={
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/gateways/create')}><Icons.Plus size={14} /> New gateway</button>
          } />
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', overflow: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input className="input" placeholder="Search gateways…" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} style={{ flex: '1 1 240px', maxWidth: 360 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {(['active', 'paused', undefined] as const).map((s) => (
                  <button key={String(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)}>{s ?? 'all'}</button>
                ))}
              </div>
            </div>
            {filtered.length === 0 && !loading ? (
              <EmptyGateways onCreate={() => router.push('/gateways/create')} />
            ) : (
              <div className="dash-cards">
                {filtered.map((gw) => (
                  <GatewayCard key={gw.id} gw={gw}
                    onSelect={() => router.push(`/gateways/${gw.id}/edit`)}
                    onDelete={() => setDeleteModal({ isOpen: true, gw })}
                    onPause={() => setPauseModal({ isOpen: true, gw })}
                    onResume={() => handleResume(gw)}
                    isDeleting={deletingId === gw.id}
                    isActioning={actioningId === gw.id}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, gw: null })} onConfirm={handleDelete} title="Delete gateway" message={`Delete "${deleteModal.gw?.name}" at ${deleteModal.gw?.fullDomain}? This cannot be undone.`} confirmText="Delete" loading={!!deletingId} />
      <PauseModal isOpen={pauseModal.isOpen} onClose={() => setPauseModal({ isOpen: false, gw: null })} onConfirm={handlePause} lbName={pauseModal.gw?.name ?? ''} />
    </div>
  );
}
