'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  clientId: string;
  initialClientRef: string | null;
}

export default function ClientRefForm({ clientId, initialClientRef }: Props) {
  const router = useRouter();
  const [clientRef, setClientRef] = useState(initialClientRef ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch('/api/admin/update-client-ref', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientRef }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Could not save.');
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="card" style={{ padding: '10px 16px', margin: '12px 0', display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--gray)' }}>Client ID</span>
      <input
        value={clientRef}
        onChange={(e) => setClientRef(e.target.value)}
        placeholder="Set your own ID…"
        style={{ width: 200 }}
      />
      <button type="button" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
      {error && <span className="error-text" style={{ fontSize: 12 }}>{error}</span>}
    </div>
  );
}
