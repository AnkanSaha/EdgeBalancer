'use client';

/** Index-derived so the markup is identical on the server and client render. */
const RAIN_DROPS = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 9) * 0.35,
  duration: 1.7 + (i % 5) * 0.45,
  length: 38 + (i % 4) * 20,
}));

/** Full-screen ambient rain. Fixed and click-through, so it never affects layout or input. */
export function RainLayer({ tone = 'var(--accent)' }: { tone?: string }) {
  return (
    <div className="ai-rain" aria-hidden>
      {RAIN_DROPS.map((d, i) => (
        <div
          key={i}
          className="ai-drop"
          style={{
            left: `${d.left}%`,
            height: d.length,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            background: `linear-gradient(to bottom, transparent, ${tone})`,
          }}
        />
      ))}
    </div>
  );
}
