'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

const INDUSTRIES = ['Plumbing', 'HVAC', 'Electrical', 'Other'];

export default function Step2BusinessInfo({ state, update, userId, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        business_name: state.businessName,
        phone: state.phone,
        industry: state.industry,
        address: state.address,
      })
      .eq('id', userId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Tell Us About Your Business</h2>

      <div className="field">
        <label htmlFor="businessName">Business Name</label>
        <input id="businessName" required value={state.businessName} onChange={(e) => update({ businessName: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="phone">Business Phone</label>
        <input id="phone" type="tel" required value={state.phone} onChange={(e) => update({ phone: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="industry">Industry</label>
        <select id="industry" required value={state.industry} onChange={(e) => update({ industry: e.target.value })}>
          <option value="" disabled>Select an industry</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="address">Business Address</label>
        <input id="address" required value={state.address} onChange={(e) => update({ address: e.target.value })} />
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </form>
  );
}
