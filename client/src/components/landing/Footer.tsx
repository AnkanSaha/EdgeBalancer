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
    <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
      <div style={{
        maxWidth: 'min(1800px, 100vw)', margin: '0 auto',
        padding: '32px clamp(16px, 4vw, 48px)',
        display: 'grid', gridTemplateColumns: '1.2fr repeat(3, 1fr)', gap: 'clamp(24px, 4vw, 48px)',
      }} className="footer-grid">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>EdgeBalancer</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.6, maxWidth: 260 }}>
            Control plane for Cloudflare Worker load balancers & API gateways. Deploy in 60 seconds.
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
            Status: <span style={{ color: statusColor }}>{statusText}</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Product</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
            <a href="/features" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Features</a>
            <a href="/strategies" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Strategies</a>
            <a href="/pricing" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Pricing</a>
            <a href="/stats" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Stats</a>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Resources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
            <a href="/blog" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Blog</a>
            <a href="/faq" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>FAQ</a>
            <a href="/security" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Security</a>
            <a href="/contact" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Contact</a>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Legal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
            <a href="/terms" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Terms</a>
            <a href="/privacy" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Privacy</a>
            <a href="/refund" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Refund</a>
            <a href="/cancellation" className="nav-link" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 'normal' }}>Cancellation</a>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 'min(1800px, 100vw)', margin: '0 auto',
        padding: '16px clamp(16px, 4vw, 48px)', borderTop: '1px solid var(--line)',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div>&copy; 2026 Nexoral — EdgeBalancer</div>
        <div>Built on Cloudflare Workers · 330+ PoPs</div>
      </div>
      <style>{`@media (max-width: 640px) { .footer-grid { grid-templateColumns: 1fr 1fr !important; } }`}</style>
    </footer>
  );
}
