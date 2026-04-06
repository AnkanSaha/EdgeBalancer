'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { DeploymentOverlay, DeploymentSuccessModal } from '@/components/loadbalancers/DeploymentExperience';
import type { LoadBalancer } from '@/types/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loadBalancers, setLoadBalancers] = useState<LoadBalancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; lb: LoadBalancer | null }>({
    isOpen: false,
    lb: null,
  });
  const [deleteSuccess, setDeleteSuccess] = useState<{ name: string; fullDomain: string } | null>(null);

  useEffect(() => {
    // Redirect to onboarding if CF credentials not setup
    if (!authLoading && user && !user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Fetch load balancers
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
    setDeletingId(id);
    try {
      const response = await api.deleteLoadBalancer(id);
      if (response.success) {
        setLoadBalancers(loadBalancers.filter(lb => lb.id !== id));
        closeDeleteModal();
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
      <div className="min-h-screen bg-background">
        <nav className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">EdgeBalancer</h1>
              <div className="flex items-center gap-4">
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card border border-border rounded-lg animate-pulse"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">EdgeBalancer</h1>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push('/settings')}>
                Settings
              </Button>
              <div className="text-sm text-muted-foreground">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Load Balancers</h2>
            <p className="text-muted-foreground">
              Manage your Cloudflare Worker-based load balancers
            </p>
          </div>
          <Button 
            size="lg"
            onClick={() => router.push('/loadbalancers/create')}
          >
            Create Load Balancer
          </Button>
        </div>

        {/* Load Balancers List */}
        {loadBalancers.length === 0 ? (
          <EmptyState onCreateClick={() => router.push('/loadbalancers/create')} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadBalancers.map((lb) => (
              <LoadBalancerCard
                key={lb.id}
                loadBalancer={lb}
                onDelete={openDeleteModal}
                isDeleting={deletingId === lb.id}
              />
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
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
      </main>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg 
            className="w-8 h-8 text-primary" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 10V3L4 14h7v7l9-11h-7z" 
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">No load balancers yet</h3>
        <p className="text-muted-foreground mb-6">
          Create your first load balancer to get started distributing traffic across your origin servers
        </p>
        <Button size="lg" onClick={onCreateClick}>
          Create Your First Load Balancer
        </Button>
      </div>
    </Card>
  );
}

function LoadBalancerCard({
  loadBalancer,
  onDelete,
  isDeleting
}: {
  loadBalancer: LoadBalancer;
  onDelete: (lb: LoadBalancer) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {loadBalancer.name}
          </p>
          <h3 className="font-semibold text-lg mb-1 truncate">
            {loadBalancer.fullDomain}
          </h3>
          <a
            href={loadBalancer.workerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate block"
          >
            {loadBalancer.workerUrl}
          </a>
        </div>
        <Badge variant={loadBalancer.status === 'active' ? 'default' : 'secondary'}>
          {loadBalancer.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Origins</span>
          <span className="font-medium">{loadBalancer.originCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Strategy</span>
          <span className="font-medium">{loadBalancer.strategy}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{formatDate(loadBalancer.createdAt)}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/loadbalancers/${loadBalancer.id}/edit`)}
            disabled={isDeleting}
            className="w-full"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(loadBalancer)}
            disabled={isDeleting}
            className="w-full text-red-500 hover:text-red-600 hover:border-red-500 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
