'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { LoadBalancerCard, EmptyState } from '@/components/dashboard/LoadBalancerCard';
import { Icons } from '@/components/shared/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { PauseModal } from '@/components/loadbalancers/PauseModal';
import { DeploymentOverlay, DeploymentSuccessModal } from '@/components/loadbalancers/DeploymentExperience';
import { AiPromptCard, AiProgressOverlay, applyAiEvent, initialAiRunState, type AiRunState } from '@/components/dashboard/AiBuilder';
import { streamAiGeneration } from '@/lib/aiStream';
import type { LoadBalancer, LoadBalancerAnalytics } from '@/types/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, LoadBalancerAnalytics | null>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [currentNav, setCurrentNav] = useState('balancers');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState<{ isOpen: boolean; lb: LoadBalancer | null }>({ isOpen: false, lb: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lb: LoadBalancer | null }>({ isOpen: false, lb: null });
  const [deleteSuccess, setDeleteSuccess] = useState<{ name: string; fullDomain: string } | null>(null);

  // AI provisioning state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRun, setAiRun] = useState<AiRunState | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const aiRunRef = useRef<AiRunState | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  aiRunRef.current = aiRun;

  // Search & filter state
  const [searchValue, setSearchValue] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(searchValue), 300);
    return () => clearTimeout(t);
  }, [searchValue]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await api.getBatchLoadBalancerAnalytics('24h');
      if (response.success && response.data?.analytics) {
        setAnalyticsMap(response.data.analytics);
      }
    } catch {
      // silent — analytics failure must not break the dashboard
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchLoadBalancers = useCallback(async (opts?: { initial?: boolean }) => {
    try {
      if (opts?.initial) setLoading(true);
      else setIsFetching(true);

      const response = await api.getLoadBalancers({
        search: searchDebounce || undefined,
        status: statusFilter,
      });
      if (response.success && response.data?.loadBalancers) {
        setLoadBalancers(response.data.loadBalancers);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch load balancers');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [searchDebounce, statusFilter]);

  useEffect(() => {
    if (!authLoading && user && !user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Initial load — fetch LBs and analytics in parallel
  useEffect(() => {
    if (user) {
      fetchLoadBalancers({ initial: true });
      fetchAnalytics();
    }
  }, [user]);

  // Re-fetch LBs on filter/search change (analytics unchanged — search doesn't affect stats)
  useEffect(() => {
    if (user && !loading) fetchLoadBalancers();
  }, [searchDebounce, statusFilter]);

  // Re-fetch analytics after pause/resume/delete so stats stay current
  const refreshAll = useCallback(() => {
    fetchLoadBalancers();
    fetchAnalytics();
  }, [fetchLoadBalancers, fetchAnalytics]);

  const runAiGeneration = useCallback(async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;

    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiRun(initialAiRunState);

    try {
      await streamAiGeneration(prompt, {
        signal: controller.signal,
        onEvent: (event) => setAiRun((current) => applyAiEvent(current ?? initialAiRunState, event)),
      });
    } catch (error: any) {
      // Aborting closes the request, which the server treats as a cancellation and rolls back.
      const cancelled = controller.signal.aborted;
      setAiRun((current) => {
        const base = current ?? initialAiRunState;
        return cancelled
          ? { ...base, phase: 'done', outcome: 'failure', message: 'You cancelled the run. The step in progress was rolled back; anything already finished was kept.' }
          : applyAiEvent(base, { name: 'error', payload: { message: error.message || 'AI generation failed' } });
      });
    } finally {
      aiAbortRef.current = null;
    }
  }, [aiPrompt]);

  const cancelAiGeneration = useCallback(() => aiAbortRef.current?.abort(), []);

  // The agent only ever prepares a destructive step. Running it is a plain REST call from here,
  // through the same endpoints the dashboard buttons already use.
  const confirmAiAction = useCallback(async () => {
    const pending = aiRunRef.current?.pendingAction;
    if (!pending) return;

    const { action, loadBalancerId, payload } = pending;
    setActionPending(true);
    try {
      if (action === 'delete') await api.deleteLoadBalancer(loadBalancerId);
      else if (action === 'pause') await api.pauseLoadBalancer(loadBalancerId, (payload?.mode as 'release-domain' | 'keep-domain') ?? 'keep-domain');
      else if (action === 'resume') await api.resumeLoadBalancer(loadBalancerId);
      else await api.updateLoadBalancer(loadBalancerId, payload ?? {});

      // Mark the AI run as success now that the action is confirmed
      const runId = aiRunRef.current?.runId;
      if (runId) {
        try { await api.completeAiRun(runId); } catch {}
      }

      toast.success(`${pending.name} updated`);
      setAiPrompt('');
      setAiRun(null);
      refreshAll();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setActionPending(false);
    }
  }, [refreshAll]);

  // A failed run can still have deployed something before it broke, so always resync.
  const closeAiOverlay = useCallback((clearPrompt: boolean) => {
    aiAbortRef.current?.abort();
    if (clearPrompt) setAiPrompt('');
    setAiRun(null);
    refreshAll();
  }, [refreshAll]);

  const handleNav = (id: string) => {
    if (id === 'settings') router.push('/settings');
    else if (id === 'sessions') router.push('/sessions');
    else if (id === 'ai-runs') router.push('/ai-runs');
    else setCurrentNav(id);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const openPauseModal = (lb: LoadBalancer) => setPauseModal({ isOpen: true, lb });

  const handlePause = async (mode: 'release-domain' | 'keep-domain') => {
    if (!pauseModal.lb) return;
    const lb = pauseModal.lb;
    setPauseModal({ isOpen: false, lb: null });
    setActioningId(lb.id);
    try {
      const response = await api.pauseLoadBalancer(lb.id, mode);
      if (response.success) {
        toast.success(response.message || 'Load balancer paused');
        refreshAll();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause load balancer');
    } finally {
      setActioningId(null);
    }
  };

  const handleResume = async (lb: LoadBalancer) => {
    setActioningId(lb.id);
    try {
      const response = await api.resumeLoadBalancer(lb.id);
      if (response.success) {
        toast.success(response.message || 'Load balancer resumed');
        refreshAll();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume load balancer');
    } finally {
      setActioningId(null);
    }
  };

  const openDeleteModal = (lb: LoadBalancer) => setDeleteModal({ isOpen: true, lb });

  const closeDeleteModal = () => {
    if (!deletingId) setDeleteModal({ isOpen: false, lb: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.lb) return;
    const id = deleteModal.lb.id;
    const deletedLoadBalancer = deleteModal.lb;
    closeDeleteModal();
    setDeletingId(id);
    try {
      const response = await api.deleteLoadBalancer(id);
      if (response.success) {
        setLoadBalancers(loadBalancers.filter(lb => lb.id !== id));
        setDeleteSuccess({ name: deletedLoadBalancer.name, fullDomain: deletedLoadBalancer.fullDomain });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete load balancer');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, margin: '0 auto 16px',
            border: '2px solid var(--line)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ color: 'var(--text-3)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const hasBalancers = loadBalancers.length > 0 || searchValue || statusFilter;
  const filterLabels: Array<{ label: string; value: 'active' | 'paused' | undefined }> = [
    { label: 'All', value: undefined },
    { label: 'Live', value: 'active' },
    { label: 'Paused', value: 'paused' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column' }}>

      <div className="app-shell">
        <Sidebar
          current={currentNav}
          onNav={handleNav}
          onLogout={handleLogout}
          userEmail={user?.email}
          hasCloudflareCredentials={user?.hasCloudflareCredentials}
          cloudflareOAuthConnected={user?.cloudflareOAuthConnected}
          isReady={!!user?.hasCloudflareCredentials}
        />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar
            crumbs={['Dashboard', currentNav]}
            title="Load Balancers"
            subtitle="Manage your Cloudflare Worker-based load balancers"
            actions={
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => { fetchLoadBalancers(); fetchAnalytics(); }}>
                  <Icons.Refresh size={14} /> <span className="hide-sm">Refresh</span>
                </button>
                {hasBalancers && (
                  <button className="btn btn-primary btn-sm hide-sm" onClick={() => router.push('/loadbalancers/create')}>
                    <Icons.Plus size={14} /> <span className="hide-md">Create Load Balancer</span><span className="hide-md-inverse">New</span>
                  </button>
                )}
              </>
            }
          />
          <div style={{ padding: 'clamp(16px, 4vw, 32px)', overflow: 'auto', flex: 1 }}>
            <AiPromptCard
              value={aiPrompt}
              onChange={setAiPrompt}
              onSubmit={runAiGeneration}
              disabled={!!aiRun}
            />

            {!hasBalancers && !loading ? (
              <EmptyState onCreate={() => router.push('/loadbalancers/create')} />
            ) : (
              <>
                {/* Summary */}
                <div className="dash-stats" style={{
                  gap: 'clamp(12px, 2vw, 16px)', marginBottom: 'clamp(20px, 4vw, 32px)',
                }}>
                  {[
                    { l: 'Active balancers', v: loadBalancers.filter(b => b.status === 'active').length, sub: `of ${loadBalancers.length} total` },
                    { l: 'Origins total', v: loadBalancers.reduce((a, b) => a + (b.originCount || 0), 0), sub: 'all checks passing', color: 'var(--green)' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="feature-card animate-slide-up"
                      style={{ padding: 'clamp(16px, 2vw, 20px)', animationDelay: `${i * 0.08}s` }}
                    >
                      <div className="kicker" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>{s.l}</div>
                      <div className="mono" style={{ fontSize: 'clamp(20px, 3vw, 24px)', marginTop: 8, letterSpacing: '-0.02em', color: s.color || 'var(--text)' }}>
                        {s.v}
                      </div>
                      <div style={{ fontSize: 'clamp(11px, 1vw, 12px)', color: 'var(--text-3)', marginTop: 4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Filter row */}
                <div className="dash-filters" style={{ gap: 'clamp(8px, 2vw, 12px)', marginBottom: 'clamp(16px, 3vw, 20px)', flexWrap: 'wrap' }}>
                  <div className="dash-search">
                    <Icons.Search size={14} style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-3)',
                    }} />
                    <input
                      className="input"
                      placeholder="Search balancers…"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      style={{ paddingLeft: 36, height: 38, padding: '8px 12px 8px 36px' }}
                    />
                  </div>
                  <div className="dash-pills" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {filterLabels.map(({ label, value }) => {
                      const isActive = statusFilter === value;
                      return (
                        <button
                          key={label}
                          onClick={() => setStatusFilter(value)}
                          className="btn btn-sm"
                          style={{
                            background: isActive ? 'var(--accent-dim)' : '#ffffff0d',
                            color: isActive ? 'var(--accent)' : 'var(--text-3)',
                            border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                            borderRadius: 999,
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 'clamp(12px, 2vw, 13px)',
                            padding: 'clamp(6px, 1vw, 8px) clamp(10px, 2vw, 12px)',
                          }}
                        >{label}</button>
                      );
                    })}
                  </div>
                  <div className="hide-sm" style={{ flex: 1, minWidth: 0 }} />
                  <div className="kicker hide-sm" style={{ fontSize: 'clamp(9px, 2vw, 11px)', opacity: isFetching ? 0.5 : 1 }}>
                    {loadBalancers.length} results
                  </div>
                </div>

                <div className="dash-cards" style={{
                  opacity: isFetching ? 0.6 : 1, transition: 'opacity 200ms',
                }}>
                  {loadBalancers.map(lb => (
                    <LoadBalancerCard
                      key={lb.id}
                      lb={lb}
                      analytics={analyticsLoading ? 'loading' : (analyticsMap[lb.id] ?? null)}
                      onSelect={() => router.push(`/loadbalancers/${lb.id}/edit`)}
                      onDelete={() => openDeleteModal(lb)}
                      onPause={() => openPauseModal(lb)}
                      onResume={() => handleResume(lb)}
                      isDeleting={deletingId === lb.id}
                      isActioning={actioningId === lb.id}
                    />
                  ))}
                  {loadBalancers.length === 0 && !isFetching && (searchValue || statusFilter) && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                      No load balancers match your filter.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <AiProgressOverlay
        isOpen={!!aiRun}
        run={aiRun ?? initialAiRunState}
        actionPending={actionPending}
        onConfirmAction={confirmAiAction}
        onCancel={cancelAiGeneration}
        onClose={() => closeAiOverlay(aiRun?.outcome === 'success')}
        onRetry={() => closeAiOverlay(false)}
      />

      <PauseModal
        isOpen={pauseModal.isOpen}
        onClose={() => setPauseModal({ isOpen: false, lb: null })}
        onConfirm={handlePause}
        lbName={pauseModal.lb?.name || ''}
        loading={!!actioningId}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Load Balancer"
        message={`Are you sure you want to delete the load balancer for ${deleteModal.lb?.fullDomain}? This will remove the Cloudflare Worker and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={!!deletingId}
      />

      <DeploymentOverlay
        isOpen={!!deletingId}
        mode="delete"
        targetName={deleteModal.lb?.name || ''}
        onCancel={() => {}}
        cancelRequested={false}
        cancellable={false}
      />

      <DeploymentSuccessModal
        isOpen={!!deleteSuccess}
        mode="delete"
        name={deleteSuccess?.name || ''}
        fullDomain={deleteSuccess?.fullDomain || ''}
        onContinue={() => setDeleteSuccess(null)}
      />
    </div>
  );
}
