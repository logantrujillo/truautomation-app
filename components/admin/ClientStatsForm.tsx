'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  clientId: string;
  initialMinutesUsed: number;
  initialAppointmentsBooked: number;
  initialCallsHandled: number;
}

export default function ClientStatsForm({
  clientId,
  initialMinutesUsed,
  initialAppointmentsBooked,
  initialCallsHandled,
}: Props) {
  const router = useRouter();
  const [minutesUsed, setMinutesUsed] = useState(String(initialMinutesUsed));
  const [appointmentsBooked, setAppointmentsBooked] = useState(String(initialAppointmentsBooked));
  const [callsHandled, setCallsHandled] = useState(String(initialCallsHandled));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch('/api/admin/update-client-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        minutesUsed: Number(minutesUsed),
        appointmentsBooked: Number(appointmentsBooked),
        callsHandled: Number(callsHandled),
      }),
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
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Monthly Stats (Manual)</h2>
      <div className="field">
        <label>Minutes Used This Month</label>
        <input type="number" min="0" step="0.1" value={minutesUsed} onChange={(e) => setMinutesUsed(e.target.value)} />
      </div>
      <div className="field">
        <label>Appointments Booked This Month</label>
        <input type="number" min="0" step="1" value={appointmentsBooked} onChange={(e) => setAppointmentsBooked(e.target.value)} />
      </div>
      <div className="field">
        <label>Total Calls Handled This Month</label>
        <input type="number" min="0" step="1" value={callsHandled} onChange={(e) => setCallsHandled(e.target.value)} />
      </div>
      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
      <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  );
}
