export const Logo = ({ size = 20 }: { size?: number }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L22 7 L22 17 L12 22 L2 17 L2 7 Z" stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-dim)" />
      <circle cx="12" cy="12" r="3" fill="var(--accent)" />
      <path d="M12 9 L12 5 M12 15 L12 19 M9 12 L5 12 M15 12 L19 12" stroke="var(--accent)" strokeWidth="1.2" />
    </svg>
    <span style={{
      fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600,
      letterSpacing: '-0.02em'
    }}>
      edge<span style={{ color: 'var(--accent)' }}>/</span>balancer
    </span>
  </div>
);
