import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <div className="hero-eyebrow" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)',
        borderRadius: 100, padding: '6px 16px', fontSize: 12, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 2, color: 'var(--orange)', marginBottom: 28,
      }}>
        Client Portal
      </div>
      <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginBottom: 20 }}>
        Welcome to <span style={{ color: 'var(--yellow)' }}>TruAutomation</span>
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 520, marginBottom: 40, fontSize: 17, lineHeight: 1.7 }}>
        Manage your Alex AI receptionist, view call logs, and update your business settings.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/login" className="btn-primary">Log In</Link>
        <Link href="/signup" className="btn-secondary">Get Started</Link>
      </div>
    </main>
  );
}
