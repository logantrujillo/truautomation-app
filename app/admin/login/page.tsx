'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Login failed');
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
          <label htmlFor="username">Username</label>
          <input id="username" type="text" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>
    </main>
  );
}
