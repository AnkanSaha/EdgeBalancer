'use client';

export const FlowDiagram = () => {
  return (
    <div style={{
      position: 'relative', aspectRatio: '1/1', maxWidth: 'min(1100px, 100%)',
      background: 'var(--bg-1)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)', padding: 40, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 12,
        color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        <span>edge.topology</span>
        <span style={{ color: 'var(--accent)' }}>● live</span>
      </div>

      <svg viewBox="0 0 400 360" style={{ width: '100%', height: 'calc(100% - 28px)', marginTop: 10 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Clients */}
        {[60, 130, 200, 270].map((y, i) => (
          <g key={i}>
            <circle cx="46" cy={y} r="8" fill="var(--bg-2)" stroke="var(--text-3)" strokeWidth="1.5" />
            <text x="14" y={y + 5} fontSize="11" fontFamily="var(--mono)" fill="var(--text-3)">
              {['US', 'EU', 'APAC', 'SA'][i]}
            </text>
          </g>
        ))}

        {/* Flow lines to worker */}
        {[60, 130, 200, 270].map((y, i) => (
          <path
            key={i}
            d={`M 54 ${y} Q 110 ${y}, 134 180 T 180 180`}
            stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.55"
            strokeDasharray="6 6"
            style={{ animation: `flow ${2 + i * 0.3}s linear infinite` }}
          />
        ))}

        {/* Worker (center) */}
        <g filter="url(#glow)">
          <path d="M 200 138 L 244 160 L 244 200 L 200 222 L 156 200 L 156 160 Z"
            fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="2" />
          <circle cx="200" cy="180" r="10" fill="var(--accent)" />
        </g>
        <text x="200" y="250" fontSize="12" fontFamily="var(--mono)"
          fill="var(--text-2)" textAnchor="middle">cloudflare.worker</text>
        <text x="200" y="264" fontSize="11" fontFamily="var(--mono)"
          fill="var(--text-3)" textAnchor="middle">production-api</text>

        {/* Flow lines to origins */}
        {[
          { y: 80, label: 'origin-01', ok: true, weight: '30%' },
          { y: 150, label: 'origin-02', ok: true, weight: '40%' },
          { y: 220, label: 'origin-03', ok: true, weight: '20%' },
          { y: 290, label: 'origin-04', ok: false, weight: '10%' },
        ].map((o, i) => (
          <g key={i}>
            <path
              d={`M 224 180 Q 290 180, 312 ${o.y} T 342 ${o.y}`}
              stroke={o.ok ? 'var(--accent)' : 'var(--red)'}
              strokeWidth="2" fill="none" opacity="0.55"
              strokeDasharray="6 6"
              style={{ animation: `flow ${2.2 + i * 0.25}s linear infinite` }}
            />
            <rect x="336" y={o.y - 13} width="58" height="26" rx="4"
              fill="var(--bg-2)" stroke={o.ok ? 'var(--line-2)' : 'var(--red)'} strokeWidth="1.5" />
            <circle cx="365" cy={o.y} r="5" fill={o.ok ? 'var(--green)' : 'var(--red)'} />
            <text x="365" y={o.y + 4} fontSize="11" fontFamily="var(--mono)"
              fill="var(--text-2)" textAnchor="middle">
              {o.weight}
            </text>
          </g>
        ))}

        {/* Labels */}
        <text x="46" y="330" fontSize="12" fontFamily="var(--mono)"
          fill="var(--text-3)" textAnchor="start" fontWeight="600">clients</text>
        <text x="365" y="330" fontSize="12" fontFamily="var(--mono)"
          fill="var(--text-3)" textAnchor="middle" fontWeight="600">origins</text>
      </svg>
    </div>
  );
};
