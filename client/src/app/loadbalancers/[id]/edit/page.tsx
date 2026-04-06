'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { LoadBalancerForm } from '@/components/loadbalancers/LoadBalancerForm';
import type { CreateLoadBalancerRequest, LoadBalancer } from '@/types/api';
import toast from 'react-hot-toast';

export default function EditLoadBalancerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadBalancer, setLoadBalancer] = useState<LoadBalancer | null>(null);

  useEffect(() => {
    if (authLoading) return;

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
  }, [authLoading, user, router, params]);

  const fetchLoadBalancer = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.getLoadBalancer(id);
      if (response.success && response.data?.loadBalancer) {
        setLoadBalancer(response.data.loadBalancer);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load load balancer');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload: CreateLoadBalancerRequest, operationId: string) => {
    if (!params?.id) {
      throw new Error('Missing load balancer id');
    }

    const response = await api.updateLoadBalancer(params.id, payload, {
      headers: {
        'x-operation-id': operationId,
      },
    });
    if (!response.success || !response.data?.loadBalancer) {
      throw new Error(response.message || 'Failed to update load balancer');
    }

    return {
      name: response.data.loadBalancer.name,
      fullDomain: response.data.loadBalancer.fullDomain,
    };
  };

  if (authLoading || loading || !loadBalancer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading load balancer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            ← Back
          </Button>
          <div>
            <h1 className="text-xl font-bold">Edit Load Balancer</h1>
            <p className="text-sm text-muted-foreground">
              Configuration changes are promoted through Worker version deployments. Domain changes are handled through Cloudflare custom domain attachments.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <LoadBalancerForm
          mode="edit"
          initialLoadBalancer={loadBalancer}
          onCancel={() => router.push('/dashboard')}
          onSuccess={() => router.push('/dashboard')}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
