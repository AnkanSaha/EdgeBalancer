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
  const { user, refreshUser, logout } = useAuth();
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
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Sidebar - Reused from Dashboard */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1 rounded-lg">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 uppercase">EdgeBalancer</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
          >
            <span className="text-lg">📊</span> Dashboard
          </button>
          <button
            onClick={() => setActiveTab(activeTab)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50 rounded-xl transition-all"
          >
            <span className="text-lg">⚙️</span> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-500 font-medium">Manage your account and integrations</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('cloudflare')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'cloudflare'
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cloudflare
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'profile' ? (
              <ProfileSettings />
            ) : (
              <CloudflareSettings user={user} refreshUser={refreshUser} />
            )}
          </div>
        </div>
      </main>
    </div>
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
    if (!formData.currentPassword) newErrors.currentPassword = 'Required';
    if (!formData.newPassword) newErrors.newPassword = 'Required';
    else if (formData.newPassword.length < 8) newErrors.newPassword = 'Min 8 characters';
    if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords mismatch';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password updated');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-10 border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 pointer-events-none">🔒</div>
      <div className="max-w-xl">
        <h2 className="text-xl font-black text-slate-900 mb-2">Update Password</h2>
        <p className="text-slate-500 font-medium text-sm mb-10">
          We recommend using a unique password for EdgeBalancer to keep your Cloudflare tokens safe.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Password</label>
              <Input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="bg-slate-50 border-slate-200 h-12 font-medium"
                disabled={loading}
              />
              {errors.currentPassword && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.currentPassword}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">New Password</label>
                <Input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 font-medium"
                  disabled={loading}
                />
                {errors.newPassword && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.newPassword}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Confirm New</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 font-medium"
                  disabled={loading}
                />
                {errors.confirmPassword && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-xl"
          >
            {loading ? 'Processing...' : 'Update Security'}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function CloudflareSettings({ user, refreshUser }: any) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState<{ accountId: string | null; apiToken: string | null }>({
    accountId: null,
    apiToken: null,
  });
  const [formData, setFormData] = useState({ accountId: '', apiToken: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.hasCloudflareCredentials) fetchCredentials();
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
    } catch (error) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId.trim()) return toast.error('Account ID missing');
    setLoading(true);
    try {
      await api.updateCloudflareCredentials({
        accountId: formData.accountId,
        apiToken: formData.apiToken,
      });
      toast.success('Credentials Updated');
      await refreshUser();
      await fetchCredentials();
      setEditing(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-10 border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 text-4xl opacity-10 pointer-events-none">🌩️</div>
      <div className="max-w-xl">
        <h2 className="text-xl font-black text-slate-900 mb-2">Cloudflare Integration</h2>
        <p className="text-slate-500 font-medium text-sm mb-10">
          Your credentials are encrypted with AES-256 and never leave our backend environment.
        </p>

        {!editing ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Account ID</div>
                <div className="font-mono text-sm font-bold text-slate-700">
                  {credentials.accountId || 'Not Connected'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Token</div>
                <div className="font-mono text-sm font-bold text-slate-700">
                  {credentials.apiToken ? '••••••••••••••••' : 'Not Connected'}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setEditing(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-indigo-100"
            >
              Rotate Credentials
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">New Account ID</label>
                <Input
                  placeholder="32-character ID"
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">New API Token</label>
                <Input
                  type="password"
                  placeholder="Paste new token"
                  value={formData.apiToken}
                  onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                  className="bg-slate-50 border-slate-200 h-12 font-medium"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditing(false)}
                className="h-12 px-8 rounded-xl font-bold border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 rounded-xl"
              >
                {loading ? 'Verifying...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
