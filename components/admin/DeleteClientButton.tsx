'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  clientId: string;
  confirmLabel: string;
}

export default function DeleteClientButton({ clientId, confirmLabel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res = await fetch('/api/admin/delete-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setDeleting(false);
      setError(data.error || 'Could not delete account.');
      return;
    }

    router.push('/admin/clients');
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn-danger" onClick={() => setOpen(true)}>
        Delete Account
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div className="card" style={{ padding: 24, border: '1px solid var(--red)', maxWidth: 440, width: '100%' }}>
            <h2 style={{ fontSize: 18, marginBottom: 8, color: 'var(--red)' }}>Delete Account</h2>
            <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 16 }}>
              This permanently deletes this client&apos;s login, dashboard data, call logs, appointments, and Google
              connection, and cancels their Stripe subscription. This cannot be undone.
            </p>
            <div className="field">
              <label>
                Type <strong>{confirmLabel}</strong> to confirm
              </label>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={confirmLabel} />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={deleting || confirmText !== confirmLabel}
              >
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setOpen(false);
                  setConfirmText('');
                  setError(null);
                }}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
