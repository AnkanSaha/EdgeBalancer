import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'EdgeBalancer — Cloudflare Worker Load Balancer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0f',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="24" cy="24" r="6" fill="#6366f1" />
            <line x1="24" y1="18" x2="24" y2="4" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="29" y1="21" x2="42" y2="14" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="29" y1="27" x2="42" y2="34" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="24" y1="30" x2="24" y2="44" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="19" y1="27" x2="6" y2="34" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="19" y1="21" x2="6" y2="14" stroke="#6366f1" strokeWidth="1.5" />
          </svg>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            edge/balancer
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}
        >
          Cloudflare Worker
          <br />
          <span style={{ color: '#6366f1' }}>Load Balancer</span>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 24,
            color: '#9ca3af',
            lineHeight: 1.5,
            maxWidth: 700,
          }}
        >
          Deploy load balancers on Cloudflare Workers in 90 seconds.
          7 strategies, health checks, per-origin weights — no code required.
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 80,
            fontSize: 18,
            color: '#6b7280',
            fontFamily: 'monospace',
          }}
        >
          edge.nexoral.in
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
