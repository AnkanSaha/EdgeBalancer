import Link from 'next/link';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav />
      <main style={{ maxWidth: 520, margin: '0 auto', padding: 'clamp(100px, 15vw, 180px) clamp(16px, 4vw, 48px)', textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 600, marginBottom: 12 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--accent)', color: '#000', fontWeight: 600, borderRadius: 'var(--radius)', fontSize: 14, textDecoration: 'none' }}>
            Go home
          </Link>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text-2)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
