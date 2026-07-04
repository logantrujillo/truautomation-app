'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  onNext: (userId: string) => void;
}

export default function Step1Account({ state, update, onNext }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Creates the auth user immediately — Supabase hashes the password
    // right away, so nothing plaintext is ever stored by this app, even
    // though payment (Step 7) happens much later in the flow.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: state.email,
      password,
    });

    if (signUpError || !data.user) {
      setLoading(false);
      setError(signUpError?.message || 'Could not create account.');
      return;
    }

    const { error: insertError } = await supabase.from('clients').insert({
      id: data.user.id,
      email: state.email,
      contact_name: state.contactName,
      status: 'pending_onboarding',
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onNext(data.user.id);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Create Your Account</h2>

      <div className="field">
        <label htmlFor="contactName">Your Name</label>
        <input
          id="contactName"
          required
          value={state.contactName}
          onChange={(e) => update({ contactName: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={state.email}
          onChange={(e) => update({ email: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Creating account…' : 'Continue'}
      </button>
    </form>
  );
}
