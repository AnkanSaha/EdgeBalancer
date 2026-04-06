'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'cloudflare';

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
            >
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <TabButton
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </TabButton>
          <TabButton
            active={activeTab === 'cloudflare'}
            onClick={() => setActiveTab('cloudflare')}
          >
            Cloudflare Settings
          </TabButton>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' ? (
          <ProfileSettings />
        ) : (
          <CloudflareSettings user={user} refreshUser={refreshUser} />
        )}
      </main>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-medium transition-colors relative ${
        active
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </button>
  );
}

function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success('Password changed successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Change Password</h2>
      <p className="text-muted-foreground mb-6">
        Update your password to keep your account secure
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
            Current Password
          </label>
          <Input
            id="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={(e) => {
              setFormData({ ...formData, currentPassword: e.target.value });
              setErrors({ ...errors, currentPassword: '' });
            }}
            disabled={loading}
            className={errors.currentPassword ? 'border-red-500' : ''}
          />
          {errors.currentPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.currentPassword}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
            New Password
          </label>
          <Input
            id="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={(e) => {
              setFormData({ ...formData, newPassword: e.target.value });
              setErrors({ ...errors, newPassword: '' });
            }}
            disabled={loading}
            className={errors.newPassword ? 'border-red-500' : ''}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              setErrors({ ...errors, confirmPassword: '' });
            }}
            disabled={loading}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? 'Changing Password...' : 'Change Password'}
        </Button>
      </form>
    </Card>
  );
}

function CloudflareSettings({ user, refreshUser }: any) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState<{
    accountId: string | null;
    apiToken: string | null;
  }>({
    accountId: null,
    apiToken: null,
  });
  const [formData, setFormData] = useState({
    accountId: '',
    apiToken: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.hasCloudflareCredentials) {
      fetchCredentials();
    }
  }, [user]);

  const fetchCredentials = async () => {
    try {
      const response = await api.getCloudflareCredentials();
      if (response.success && response.data) {
        setCredentials({
          accountId: response.data.accountId,
          apiToken: response.data.apiToken,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch credentials:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountId.trim()) {
      newErrors.accountId = 'Account ID is required';
    } else if (formData.accountId.length !== 32) {
      newErrors.accountId = 'Account ID must be 32 characters';
    }

    if (!formData.apiToken.trim()) {
      newErrors.apiToken = 'API Token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.updateCloudflareCredentials({
        accountId: formData.accountId,
        apiToken: formData.apiToken,
      });

      toast.success('Cloudflare credentials updated successfully');
      await refreshUser();
      await fetchCredentials();
      setEditing(false);
      setFormData({ accountId: '', apiToken: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-2">Cloudflare Credentials</h2>
      <p className="text-muted-foreground mb-6">
        Manage your Cloudflare account connection
      </p>

      {!editing ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Account ID</label>
            <div className="px-4 py-3 rounded-lg bg-muted font-mono text-sm">
              {credentials.accountId ? (
                <span className="text-foreground">{credentials.accountId}</span>
              ) : (
                <span className="text-muted-foreground">Not configured</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Token</label>
            <div className="px-4 py-3 rounded-lg bg-muted font-mono text-sm">
              {credentials.apiToken ? (
                <span className="text-foreground">{credentials.apiToken}</span>
              ) : (
                <span className="text-muted-foreground">Not configured</span>
              )}
            </div>
          </div>

          <Button onClick={() => setEditing(true)}>
            Update Credentials
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium mb-2">
              New Account ID
            </label>
            <Input
              id="accountId"
              type="text"
              placeholder="32-character Account ID"
              value={formData.accountId}
              onChange={(e) => {
                setFormData({ ...formData, accountId: e.target.value });
                setErrors({ ...errors, accountId: '' });
              }}
              disabled={loading}
              className={errors.accountId ? 'border-red-500' : ''}
            />
            {errors.accountId && (
              <p className="text-sm text-red-500 mt-1">{errors.accountId}</p>
            )}
          </div>

          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium mb-2">
              New API Token
            </label>
            <Input
              id="apiToken"
              type="password"
              placeholder="Your API Token"
              value={formData.apiToken}
              onChange={(e) => {
                setFormData({ ...formData, apiToken: e.target.value });
                setErrors({ ...errors, apiToken: '' });
              }}
              disabled={loading}
              className={errors.apiToken ? 'border-red-500' : ''}
            />
            {errors.apiToken && (
              <p className="text-sm text-red-500 mt-1">{errors.apiToken}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setEditing(false);
                setFormData({ accountId: '', apiToken: '' });
                setErrors({});
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Validating...' : 'Update Credentials'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
