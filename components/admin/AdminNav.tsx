'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const links = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/clients', label: 'Clients' },
  ];

  return (
    <nav
      className="app-nav"
      style={{
        width: 220,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, marginBottom: 8 }}>
        Tru<span style={{ color: 'var(--orange)' }}>Automation</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 24 }}>Admin</p>

      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            color: pathname === link.href ? 'var(--white)' : 'var(--gray)',
            background: pathname === link.href ? 'rgba(255,107,53,0.12)' : 'transparent',
          }}
        >
          {link.label}
        </Link>
      ))}

      <button
        type="button"
        onClick={handleLogout}
        style={{ marginTop: 'auto', background: 'none', border: 'none', color: 'var(--gray)', fontSize: 14, textAlign: 'left', padding: '10px 14px', cursor: 'pointer' }}
      >
        Log Out
      </button>
    </nav>
  );
}
