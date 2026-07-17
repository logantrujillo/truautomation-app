'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { FaqDraft, WizardState } from './types';

interface Props {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  userId: string;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5AlexSetup({ state, update, userId, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateFaq(index: number, partial: Partial<FaqDraft>) {
    const next = [...state.faqs];
    next[index] = { ...next[index], ...partial };
    update({ faqs: next });
  }

  function addFaq() {
    update({ faqs: [...state.faqs, { question: '', answer: '' }] });
  }

  function removeFaq(index: number) {
    update({ faqs: state.faqs.filter((_, i) => i !== index) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('clients')
      .update({ alex_instructions: state.alexInstructions })
      .eq('id', userId);

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    const validFaqs = state.faqs.filter((f) => f.question.trim().length > 0 && f.answer.trim().length > 0);

    await supabase.from('faqs').delete().eq('client_id', userId);
    if (validFaqs.length > 0) {
      const { error: insertError } = await supabase
        .from('faqs')
        .insert(validFaqs.map((f) => ({ client_id: userId, question: f.question, answer: f.answer })));
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
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Set Up Alex</h2>

      <div className="field">
        <label htmlFor="alexInstructions">Special Instructions for Alex</label>
        <textarea
          id="alexInstructions"
          rows={5}
          placeholder="e.g. Always ask if it's a water leak emergency first. Mention our $99 diagnostic fee upfront."
          value={state.alexInstructions}
          onChange={(e) => update({ alexInstructions: e.target.value })}
        />
      </div>

      <h3 style={{ fontSize: 16, margin: '24px 0 12px', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Frequently Asked Questions
      </h3>
      <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
        Add common questions customers ask so Alex can answer them accurately.
      </p>
      {state.faqs.map((faq, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              placeholder="Question (e.g. Do you charge for estimates?)"
              value={faq.question}
              onChange={(e) => updateFaq(i, { question: e.target.value })}
              style={{ marginBottom: 8 }}
            />
            <textarea
              placeholder="Answer"
              rows={2}
              value={faq.answer}
              onChange={(e) => updateFaq(i, { answer: e.target.value })}
            />
          </div>
          {state.faqs.length > 1 && (
            <button type="button" className="btn-secondary" style={{ padding: '10px 16px' }} onClick={() => removeFaq(i)}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={addFaq} style={{ marginBottom: 28 }}>
        + Add FAQ
      </button>

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
