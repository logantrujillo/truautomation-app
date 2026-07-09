'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  clientId: string;
  initialTwilioNumber: string | null;
  initialVapiAgentId: string | null;
}

export default function ClientAssignmentForm({ clientId, initialTwilioNumber, initialVapiAgentId }: Props) {
  const router = useRouter();
  const [twilioNumber, setTwilioNumber] = useState(initialTwilioNumber ?? '');
  const [vapiAgentId, setVapiAgentId] = useState(initialVapiAgentId ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch('/api/admin/update-client-assignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, twilioNumber, vapiAgentId }),
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
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Assignment</h2>
      <div className="field">
        <label>Twilio Phone Number</label>
        <input value={twilioNumber} onChange={(e) => setTwilioNumber(e.target.value)} placeholder="+1 555 123 4567" />
      </div>
      <div className="field">
        <label>VAPI Agent ID</label>
        <input value={vapiAgentId} onChange={(e) => setVapiAgentId(e.target.value)} placeholder="agent_..." />
      </div>
      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
      <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  );
}
