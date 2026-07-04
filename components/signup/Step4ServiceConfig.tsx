'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { BusinessHours } from '@/lib/types';
import type { ServiceDraft, WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Step4ServiceConfig({ state, update, userId, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateService(index: number, partial: Partial<ServiceDraft>) {
    const next = [...state.services];
    next[index] = { ...next[index], ...partial };
    update({ services: next });
  }

  function addService() {
    update({ services: [...state.services, { name: '', description: '' }] });
  }

  function removeService(index: number) {
    update({ services: state.services.filter((_, i) => i !== index) });
  }

  function updateHours(day: string, partial: Partial<BusinessHours[string]>) {
    update({ businessHours: { ...state.businessHours, [day]: { ...state.businessHours[day], ...partial } } });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const validServices = state.services.filter((s) => s.name.trim().length > 0);

    const { error: hoursError } = await supabase
      .from('clients')
      .update({ business_hours: state.businessHours })
      .eq('id', userId);

    if (hoursError) {
      setLoading(false);
      setError(hoursError.message);
      return;
    }

    // Replace-all: clear existing services then insert current draft list,
    // since the wizard can be revisited/edited before payment.
    await supabase.from('services').delete().eq('client_id', userId);
    if (validServices.length > 0) {
      const { error: insertError } = await supabase
        .from('services')
        .insert(validServices.map((s) => ({ client_id: userId, name: s.name, description: s.description })));
      if (insertError) {
        setLoading(false);
        setError(insertError.message);
        return;
      }
    }

    setLoading(false);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Services & Business Hours</h2>

      <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Services You Offer
      </h3>
      {state.services.map((service, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              placeholder="Service name (e.g. Drain Cleaning)"
              value={service.name}
              onChange={(e) => updateService(i, { name: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <input
              placeholder="Short description (optional)"
              value={service.description}
              onChange={(e) => updateService(i, { description: e.target.value })}
            />
          </div>
          {state.services.length > 1 && (
            <button type="button" className="btn-secondary" style={{ padding: '10px 16px' }} onClick={() => removeService(i)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addService} style={{ marginBottom: 28 }}>
        + Add Service
      </button>

      <h3 style={{ fontSize: 16, marginBottom: 12, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Business Hours
      </h3>
      <div style={{ marginBottom: 24 }}>
        {DAYS.map((day) => {
          const hours = state.businessHours[day];
          return (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 44, fontSize: 14, fontWeight: 600 }}>{day}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0, textTransform: 'none' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={!hours.closed}
                  onChange={(e) => updateHours(day, { closed: !e.target.checked })}
                />
                <span style={{ fontSize: 13, color: 'var(--gray)' }}>Open</span>
              </label>
              {!hours.closed && (
                <>
                  <input type="time" value={hours.open} onChange={(e) => updateHours(day, { open: e.target.value })} style={{ width: 120 }} />
                  <span style={{ color: 'var(--gray)' }}>to</span>
                  <input type="time" value={hours.close} onChange={(e) => updateHours(day, { close: e.target.value })} style={{ width: 120 }} />
                </>
              )}
            </div>
          );
        })}
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
