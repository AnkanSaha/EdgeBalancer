'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/shared/Icons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiedge.nexoral.in';

interface StatsData {
  users: number;
  loadBalancers: number;
  gateways: number;
  origins: number;
  upstreams: number;
  activeBalancers: number;
  activeGateways: number;
  aiRuns: number;
  scriptsDeployed: number;
  scaled: boolean;
}

function format(n: number): string {
  return n.toLocaleString('en-IN');
}

function StatCard({
  kicker,
  label,
  value,
  sub,
  icon: Icon,
  loading,
  delay,
}: {
  kicker: string;
  label: string;
  value: number | null;
  sub: string;
  icon: (p: { size?: number; stroke?: string }) => React.JSX.Element;
  loading: boolean;
  delay: string;
}) {
  return (
    <div
      className="feature-card"
      style={{
        padding: 'clamp(18px, 2.5vw, 24px)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: loading ? undefined : `fadeInUp 0.5s ease-out ${delay} both`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div className="kicker" style={{ fontSize: 10, marginBottom: 6 }}>
            // {kicker}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(to bottom right, #f59e0b1a, #fe6e0014)',
                border: '1px solid #f59e0b33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={14} stroke="var(--accent)" />
            </span>
            {label}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        {loading ? (
          <div
            style={{
              height: 44,
              width: 120,
              borderRadius: 8,
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            className="mono"
            style={{
              fontSize: 'clamp(32px, 4vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: 'var(--text)',
            }}
          >
            {value !== null ? format(value) : '—'}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, minHeight: 18 }}>{sub}</div>
    </div>
  );
}

export function StatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/stats/public`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 503) throw new Error('Stats temporarily unavailable — database reconnecting');
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Failed to load stats (${res.status})`);
      }
      const json = await res.json();
      const d: StatsData = json.data;
      setData(d);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const originsUpstreams = data ? data.origins + data.upstreams : null;

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 20 }}>
        <button
          onClick={fetchStats}
          className="btn btn-ghost btn-sm"
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
          disabled={loading}
        >
          <Icons.Refresh size={14} style={{ animation: loading ? 'spin 1s linear infinite' : undefined }} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {updatedAt && !loading && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>Updated {updatedAt}</span>
        )}
      </div>

      {error && (
        <div
          className="feature-card"
          style={{
            marginTop: 16,
            padding: 16,
            border: '1px solid #ff656833',
            background: '#ff65680f',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <Icons.X size={16} stroke="var(--red)" />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{error}</span>
          <button onClick={fetchStats} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
            Try again
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 30vw, 340px), 1fr))',
          gap: 'clamp(14px, 2vw, 20px)',
          marginTop: 20,
        }}
      >
        <StatCard
          kicker="total users"
          label="Total Users"
          value={data?.users ?? null}
          sub="Registered accounts"
          icon={Icons.Grid}
          loading={loading}
          delay="0s"
        />
        <StatCard
          kicker="total load balancers"
          label="total Load Balancers"
          value={data?.loadBalancers ?? null}
          sub="Worker balancers deployed"
          icon={Icons.Layers}
          loading={loading}
          delay="0.06s"
        />
        <StatCard
          kicker="total api gateways"
          label="total API Gateways"
          value={data?.gateways ?? null}
          sub="Gateway workers"
          icon={Icons.Globe}
          loading={loading}
          delay="0.12s"
        />
        <StatCard
          kicker="origins + upstreams"
          label="Origins + Upstreams"
          value={originsUpstreams}
          sub="Combined pool size"
          icon={Icons.Server}
          loading={loading}
          delay="0.18s"
        />
        <StatCard
          kicker="active balancers"
          label="Active Balancers"
          value={data?.activeBalancers ?? null}
          sub="Status = active"
          icon={Icons.Activity}
          loading={loading}
          delay="0.24s"
        />
        <StatCard
          kicker="active gateways"
          label="Active Gateways"
          value={data?.activeGateways ?? null}
          sub="Status = active"
          icon={Icons.Zap}
          loading={loading}
          delay="0.30s"
        />
        <StatCard
          kicker="ai runs"
          label="AI Runs"
          value={data?.aiRuns ?? null}
          sub="Agent runs completed"
          icon={Icons.Zap}
          loading={loading}
          delay="0.36s"
        />
        <StatCard
          kicker="scripts deployed"
          label="Scripts Deployed"
          value={data?.scriptsDeployed ?? null}
          sub="Worker versions shipped"
          icon={Icons.Layers}
          loading={loading}
          delay="0.42s"
        />
      </div>

      <div
        className="feature-card"
        style={{
          marginTop: 20,
          padding: '16px 18px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--text-3)',
          letterSpacing: '0.02em',
        }}
      >
        <span>Source: live platform metrics</span>
        <span style={{ opacity: 0.7 }}>Updated live • EdgeBalancer</span>
      </div>
    </>
  );
}
