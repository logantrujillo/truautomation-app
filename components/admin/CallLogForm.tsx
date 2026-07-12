'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  clientId: string;
}

export default function CallLogForm({ clientId }: Props) {
  const router = useRouter();
  const [callerNumber, setCallerNumber] = useState('');
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch('/api/admin/add-call-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, callerNumber, transcript }),
    });
    const data = await res.json();

    setSaving(false);

    if (!res.ok) {
      setError(data.error || 'Could not save.');
      return;
    }

    setCallerNumber('');
    setTranscript('');
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Add Call Log Entry</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 320px) 1fr', gap: 20 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Caller&apos;s Number</label>
          <input
            value={callerNumber}
            onChange={(e) => setCallerNumber(e.target.value)}
            placeholder="+1 555 123 4567"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Call Transcript</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the phone call transcript here…"
            rows={6}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>
      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={handleAdd} disabled={saving}>
        {saving ? 'Adding…' : saved ? 'Added ✓' : 'Add Call'}
      </button>
    </div>
  );
}
