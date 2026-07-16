'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 400, padding: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Client Login</h1>
        <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 28 }}>Access your AI receptionist dashboard</p>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        <p style={{ marginTop: 24, fontSize: 14, color: 'var(--gray)', textAlign: 'center' }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: 'var(--orange)' }}>Sign up</Link>
        </p>
      </form>
    </main>
  );
}
