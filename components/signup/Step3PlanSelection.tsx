'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANS, SETUP_FEE } from '@/lib/plans';
import type { PlanId } from '@/lib/types';
import type { WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3PlanSelection({ state, update, userId, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!state.plan) {
      setError('Please select a plan.');
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase.from('clients').update({ plan: state.plan }).eq('id', userId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onNext();
  }

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 8 }}>Choose Your Plan</h2>
      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 24 }}>
        Both plans include a one-time ${SETUP_FEE} setup fee, billed at checkout.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const plan = PLANS[id];
          const selected = state.plan === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => update({ plan: id })}
              className="card"
              style={{
                textAlign: 'left',
                padding: 24,
                cursor: 'pointer',
                border: selected ? '2px solid var(--orange)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: selected ? '0 0 20px rgba(255,107,53,0.25)' : 'none',
              }}
            >
              <h3 style={{ fontSize: 22, marginBottom: 8 }}>{plan.label}</h3>
              <p style={{ fontSize: 28, fontFamily: 'var(--font-bebas-neue), sans-serif', color: 'var(--yellow)', marginBottom: 8 }}>
                ${plan.perMinute.toFixed(2)}<span style={{ fontSize: 14, color: 'var(--gray)' }}>/min</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>{plan.description}</p>
            </button>
          );
        })}
      </div>

      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
        <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleContinue} disabled={loading}>
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
