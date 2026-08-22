'use client';

import { useEffect, useState } from 'react';

interface PublicStats {
  users: number;
  loadBalancers: number;
  gateways: number;
  origins: number;
  upstreams: number;
}

export function HeroStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://apiedge.nexoral.in'}/api/stats/public`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) setStats(j.data);
      })
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        {[['—', 'gateways'], ['—', 'balancers'], ['—', 'origins']].map(([v, l], i) => (
          <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span> {l}
          </div>
        ))}
      </div>
    );
  }

  const items = [
    [stats.gateways, 'gateways'],
    [stats.loadBalancers, 'balancers'],
    [stats.origins + stats.upstreams, 'origins'],
  ] as const;

  return (
    <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map(([v, l], i) => (
        <div key={i} className="animate-slide-up" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', animationDelay: `${0.1 * i}s` }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{v}</span> {l}
        </div>
      ))}
      <span style={{ fontSize: 10, color: 'var(--text-3)', border: '1px solid var(--line)', padding: '2px 6px', borderRadius: 999 }}>×10 preview</span>
      <a href="/stats" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>View stats →</a>
    </div>
  );
}
