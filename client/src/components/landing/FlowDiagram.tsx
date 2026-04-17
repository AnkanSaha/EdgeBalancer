'use client';

export const FlowDiagram = () => {
  return (
    <div style={{
      position: 'relative', aspectRatio: '1/1', maxWidth: 480,
      background: 'var(--bg-1)', border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)', padding: 24, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 10,
        color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        <span>edge.topology</span>
        <span style={{ color: 'var(--accent)' }}>● live</span>
      </div>

      <svg viewBox="0 0 400 360" style={{ width: '100%', height: 'calc(100% - 24px)', marginTop: 8 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Clients */}
        {[60, 130, 200, 270].map((y, i) => (
          <g key={i}>
            <circle cx="40" cy={y} r="5" fill="var(--bg-2)" stroke="var(--text-3)" />
            <text x="10" y={y + 4} fontSize="8" fontFamily="var(--mono)" fill="var(--text-3)">
              {['US', 'EU', 'APAC', 'SA'][i]}
            </text>
          </g>
        ))}

        {/* Flow lines to worker */}
        {[60, 130, 200, 270].map((y, i) => (
          <path
            key={i}
            d={`M 45 ${y} Q 110 ${y}, 130 180 T 180 180`}
            stroke="var(--accent)" strokeWidth="1" fill="none" opacity="0.5"
            strokeDasharray="4 4"
            style={{ animation: `flow ${2 + i * 0.3}s linear infinite` }}
          />
        ))}

        {/* Worker (center) */}
        <g filter="url(#glow)">
          <path d="M 200 140 L 240 160 L 240 200 L 200 220 L 160 200 L 160 160 Z"
            fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1.5" />
          <circle cx="200" cy="180" r="6" fill="var(--accent)" />
        </g>
        <text x="200" y="245" fontSize="9" fontFamily="var(--mono)"
          fill="var(--text-2)" textAnchor="middle">cloudflare.worker</text>
        <text x="200" y="257" fontSize="8" fontFamily="var(--mono)"
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
              d={`M 220 180 Q 290 180, 310 ${o.y} T 340 ${o.y}`}
              stroke={o.ok ? 'var(--accent)' : 'var(--red)'}
              strokeWidth="1" fill="none" opacity="0.5"
              strokeDasharray="4 4"
              style={{ animation: `flow ${2.2 + i * 0.25}s linear infinite` }}
            />
            <rect x="340" y={o.y - 10} width="50" height="20" rx="3"
              fill="var(--bg-2)" stroke={o.ok ? 'var(--line-2)' : 'var(--red)'} />
            <circle cx="350" cy={o.y} r="3" fill={o.ok ? 'var(--green)' : 'var(--red)'} />
            <text x="360" y={o.y + 3} fontSize="8" fontFamily="var(--mono)" fill="var(--text-2)">
              {o.weight}
            </text>
          </g>
        ))}

        {/* Labels */}
        <text x="40" y="330" fontSize="9" fontFamily="var(--mono)"
          fill="var(--text-3)" textAnchor="start">clients</text>
        <text x="365" y="330" fontSize="9" fontFamily="var(--mono)"
          fill="var(--text-3)" textAnchor="middle">origins</text>
      </svg>
    </div>
  );
};
