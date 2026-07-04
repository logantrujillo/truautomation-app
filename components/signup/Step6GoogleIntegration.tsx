'use client';

import type { WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step6GoogleIntegration({ state, userId, onNext, onBack }: Props) {
  function connectGoogle() {
    // Full-page redirect into the OAuth flow. Everything up to this point
    // has already been saved to Supabase, so no wizard state is lost.
    // The route derives the client from the logged-in session, not from
    // a query param, so this can't be used to attach tokens to another
    // client's account.
    window.location.href = `/api/auth/google?from=signup`;
  }

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 8 }}>Connect Google</h2>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        Connect your Google account so Alex can book appointments directly on your Calendar and log
        call details to a Sheet. You can also skip this and connect it later from your dashboard settings.
      </p>

      <div
        className="card"
        style={{
          padding: 24,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Google Calendar & Sheets</p>
          <p style={{ fontSize: 13, color: 'var(--gray)' }}>
            {state.googleConnected ? 'Connected ✓' : 'Not connected'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={connectGoogle}>
          {state.googleConnected ? 'Reconnect' : 'Connect Google'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={onNext}>
          {state.googleConnected ? 'Continue' : 'Skip for Now'}
        </button>
      </div>
    </div>
  );
}
