'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
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
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message || 'Login failed');
      return;
    }

    const { data: adminRow } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .single();

    setLoading(false);

    if (!adminRow) {
      await supabase.auth.signOut();
      setError('This account is not authorized for admin access.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 400, padding: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Admin Login</h1>
        <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 28 }}>TruAutomation internal access only</p>

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
      </form>
    </main>
  );
}
