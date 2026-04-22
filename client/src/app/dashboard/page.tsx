'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Sidebar, Topbar } from '@/components/dashboard/Sidebar';
import { LoadBalancerCard, EmptyState } from '@/components/dashboard/LoadBalancerCard';
import { Icons } from '@/components/shared/Icons';
import { ConfirmModal } from '@/components/ui/Modal';
import { PauseModal } from '@/components/loadbalancers/PauseModal';
import { DeploymentOverlay, DeploymentSuccessModal } from '@/components/loadbalancers/DeploymentExperience';
import type { LoadBalancer } from '@/types/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNav, setCurrentNav] = useState('balancers');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [pauseModal, setPauseModal] = useState<{ isOpen: boolean; lb: LoadBalancer | null }>({
    isOpen: false,
    lb: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lb: LoadBalancer | null }>({
    isOpen: false,
    lb: null,
  });
  const [deleteSuccess, setDeleteSuccess] = useState<{ name: string; fullDomain: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user && !user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }

    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchLoadBalancers();
    }
  }, [user, authLoading, router]);

  const fetchLoadBalancers = async () => {
    try {
      setLoading(true);
      const response = await api.getLoadBalancers();
      if (response.success && response.data?.loadBalancers) {
        setLoadBalancers(response.data.loadBalancers);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch load balancers');
    } finally {
      setLoading(false);
    }
  };

  const handleNav = (id: string) => {
    if (id === 'settings') {
      router.push('/settings');
    } else {
      setCurrentNav(id);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const openPauseModal = (lb: LoadBalancer) => {
    setPauseModal({ isOpen: true, lb });
  };

  const handlePause = async (mode: 'release-domain' | 'keep-domain') => {
    if (!pauseModal.lb) return;
    const lb = pauseModal.lb;
    setPauseModal({ isOpen: false, lb: null });
    setActioningId(lb.id);

    try {
      const response = await api.pauseLoadBalancer(lb.id, mode);
      if (response.success) {
        toast.success(response.message || 'Load balancer paused');
        fetchLoadBalancers();
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
        fetchLoadBalancers();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resume load balancer');
    } finally {
      setActioningId(null);
    }
  };

  const openDeleteModal = (lb: LoadBalancer) => {
    setDeleteModal({ isOpen: true, lb });
  };

  const closeDeleteModal = () => {
    if (!deletingId) {
      setDeleteModal({ isOpen: false, lb: null });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.lb) return;

    const id = deleteModal.lb.id;
    const deletedLoadBalancer = deleteModal.lb;

    // Close modal immediately before starting deletion
    closeDeleteModal();
    setDeletingId(id);

    try {
      const response = await api.deleteLoadBalancer(id);
      if (response.success) {
        setLoadBalancers(loadBalancers.filter(lb => lb.id !== id));
        setDeleteSuccess({
          name: deletedLoadBalancer.name,
          fullDomain: deletedLoadBalancer.fullDomain,
        });
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

  const hasBalancers = loadBalancers.length > 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        current={currentNav}
        onNav={handleNav}
        onLogout={handleLogout}
        userEmail={user?.email}
      />
      <main style={{ flex: 1, minWidth: 0 }}>
        <Topbar
          crumbs={['Dashboard', currentNav]}
          title="Load Balancers"
          subtitle="Manage your Cloudflare Worker-based load balancers"
          actions={
            <>
              <button className="btn btn-ghost btn-sm"><Icons.Refresh size={14} /> Refresh</button>
              <button className="btn btn-primary btn-sm" onClick={() => router.push('/loadbalancers/create')}>
                <Icons.Plus size={14} /> Create Load Balancer
              </button>
            </>
          }
        />
        <div style={{ padding: 32 }}>
          {!hasBalancers ? (
            <EmptyState onCreate={() => router.push('/loadbalancers/create')} />
          ) : (
            <>
              {/* Summary */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16, marginBottom: 32,
              }}>
                {[
                  { l: 'Active balancers', v: loadBalancers.filter(b => b.status === 'active').length, sub: `of ${loadBalancers.length} total` },
                  { l: 'Origins total', v: loadBalancers.reduce((a, b) => a + (b.originCount || 0), 0), sub: 'all checks passing', color: 'var(--green)' },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div className="kicker">{s.l}</div>
                    <div className="mono" style={{ fontSize: 24, marginTop: 8, letterSpacing: '-0.02em', color: s.color || 'var(--text)' }}>
                      {s.v}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Filter row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                  <Icons.Search size={14} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-3)',
                  }} />
                  <input className="input" placeholder="Search balancers…"
                    style={{ paddingLeft: 36, height: 38, padding: '8px 12px 8px 36px' }} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['All', 'Live', 'Paused'].map((f, i) => (
                    <button key={f} className="btn btn-sm" style={{
                      background: i === 0 ? 'var(--bg-2)' : 'transparent',
                      color: i === 0 ? 'var(--text)' : 'var(--text-3)',
                      border: '1px solid var(--line)',
                    }}>{f}</button>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <div className="kicker">{loadBalancers.length} results</div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16,
              }}>
                {loadBalancers.map(lb => (
                  <LoadBalancerCard
                    key={lb.id}
                    lb={lb}
                    onSelect={() => router.push(`/loadbalancers/${lb.id}/edit`)}
                    onDelete={() => openDeleteModal(lb)}
                    onPause={() => openPauseModal(lb)}
                    onResume={() => handleResume(lb)}
                    isDeleting={deletingId === lb.id}
                    isActioning={actioningId === lb.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modals */}
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

      <style jsx>{`
        @media (max-width: 900px) {
          .sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
