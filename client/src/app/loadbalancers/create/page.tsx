'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { LoadBalancerForm } from '@/components/loadbalancers/LoadBalancerForm';
import { Button } from '@/components/ui/Button';
import type { CreateLoadBalancerRequest } from '@/types/api';

export default function CreateLoadBalancerPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!user.hasCloudflareCredentials) {
      router.push('/onboarding');
      return;
    }
  }, [user, router]);

  const handleSubmit = async (payload: CreateLoadBalancerRequest, operationId: string) => {
    const response = await api.createLoadBalancer(payload, {
      headers: {
        'x-operation-id': operationId,
      },
    });
    if (!response.success || !response.data?.loadBalancer) {
      throw new Error(response.message || 'Failed to create load balancer');
    }

    return {
      name: response.data.loadBalancer.name,
      fullDomain: response.data.loadBalancer.fullDomain,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-xl font-bold">Create Load Balancer</h1>
              <p className="text-sm text-muted-foreground">
                Deploy a new Cloudflare Worker-based load balancer with live origin routing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <LoadBalancerForm
          mode="create"
          onCancel={() => router.push('/dashboard')}
          onSuccess={() => router.push('/dashboard')}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
