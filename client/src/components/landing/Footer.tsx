'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function Footer() {
  const [status, setStatus] = useState<'ok' | 'down' | 'loading'>('loading');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        setStatus(data.status === 'ok' ? 'ok' : 'down');
      } catch {
        setStatus('down');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const statusText = status === 'loading' ? 'checking...' : status === 'ok' ? '● operational' : '● degraded';
  const statusColor = status === 'ok' ? 'var(--green)' : status === 'down' ? 'var(--red)' : 'var(--text-3)';

  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      padding: '24px clamp(16px, 4vw, 48px)',
      display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>
      <div>&copy; 2026 EdgeBalancer Inc.</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }} className="hide-sm">
        <span>Status: <span style={{ color: statusColor }}>{statusText}</span></span>
        <a href="/contact" className="nav-link" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>Security</a>
        <a href="/terms" className="nav-link" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>Terms</a>
        <a href="/privacy" className="nav-link" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>Privacy</a>
        <a href="/contact" className="nav-link" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>Contact</a>
      </div>
    </footer>
  );
}
