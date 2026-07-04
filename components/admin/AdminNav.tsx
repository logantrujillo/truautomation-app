'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <nav
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
      <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 24 }}>Admin · {email}</p>

      <Link href="/admin" style={{ padding: '10px 14px', borderRadius: 6, fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>
        Clients
      </Link>

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
