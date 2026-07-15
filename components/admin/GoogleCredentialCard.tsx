'use client';

import { useState } from 'react';

interface Props {
  refreshToken: string | null;
  calendarId: string | null;
  updatedAt: string | null;
}

export default function GoogleCredentialCard({ refreshToken, calendarId, updatedAt }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    if (!refreshToken) return;
    await navigator.clipboard.writeText(refreshToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card" style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Google Calendar Credential</h2>

      {!refreshToken ? (
        <p style={{ fontSize: 14, color: 'var(--gray)' }}>
          Client hasn&apos;t connected Google yet — nothing to hand off to n8n.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 12, fontSize: 14 }}>
          <div>
            <label style={{ display: 'block', color: 'var(--gray)', marginBottom: 4 }}>Refresh Token</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                readOnly
                value={refreshToken}
                type={revealed ? 'text' : 'password'}
                style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                onFocus={(e) => e.target.select()}
              />
              <button type="button" className="btn-secondary" onClick={() => setRevealed((v) => !v)}>
                {revealed ? 'Hide' : 'Show'}
              </button>
              <button type="button" className="btn-primary" onClick={copyToken}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>

          {calendarId && (
            <div>
              <span style={{ color: 'var(--gray)' }}>Calendar ID: </span>
              <span style={{ fontFamily: 'monospace' }}>{calendarId}</span>
            </div>
          )}

          <p style={{ color: 'var(--gray)', fontSize: 12, lineHeight: 1.6 }}>
            In this client&apos;s n8n workflow, use an HTTP Request node to exchange this for an access
            token: <code>POST https://oauth2.googleapis.com/token</code> with{' '}
            <code>client_id</code>/<code>client_secret</code> (same as this app&apos;s{' '}
            <code>GOOGLE_CLIENT_ID</code>/<code>GOOGLE_CLIENT_SECRET</code>), this{' '}
            <code>refresh_token</code>, and <code>grant_type=refresh_token</code>. Then call the
            Calendar API with <code>Authorization: Bearer &lt;access_token&gt;</code>.
          </p>

          {updatedAt && (
            <p style={{ color: 'var(--gray)', fontSize: 12 }}>
              Connected/refreshed: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
