'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { PLANS, SETUP_FEE } from '@/lib/plans';
import type { WizardState } from './types';

interface Props {
  state: WizardState;
  userId: string;
  onBack: () => void;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Step7Review({ state, onBack }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (!showCheckout) return;
    (async () => {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start checkout.');
        return;
      }
      setClientSecret(data.clientSecret);
    })();
  }, [showCheckout]);

  const plan = state.plan ? PLANS[state.plan] : null;
  const validServices = state.services.filter((s) => s.name.trim());
  const validFaqs = state.faqs.filter((f) => f.question.trim());

  return (
    <div>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>Review & Pay</h2>

      <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
        <ReviewBlock title="Account">
          <Row label="Contact" value={state.contactName} />
          <Row label="Email" value={state.email} />
        </ReviewBlock>

        <ReviewBlock title="Business">
          <Row label="Business Name" value={state.businessName} />
          <Row label="Phone" value={state.phone} />
          <Row label="Industry" value={state.industry} />
          <Row label="Address" value={state.address} />
        </ReviewBlock>

        <ReviewBlock title="Plan">
          <Row label="Plan" value={plan?.label ?? ''} />
          <Row label="Rate" value={plan ? `$${plan.perMinute.toFixed(2)}/min` : ''} />
          <Row label="Setup Fee" value={`$${SETUP_FEE} (one-time)`} />
        </ReviewBlock>

        <ReviewBlock title="Services">
          {validServices.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>None added</p>
          ) : (
            validServices.map((s, i) => <Row key={i} label={s.name} value={s.description || '—'} />)
          )}
        </ReviewBlock>

        <ReviewBlock title="FAQs">
          {validFaqs.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>None added</p>
          ) : (
            validFaqs.map((f, i) => <Row key={i} label={f.question} value={f.answer} />)
          )}
        </ReviewBlock>

        <ReviewBlock title="Google Integration">
          <Row label="Status" value={state.googleConnected ? 'Connected' : 'Not connected'} />
        </ReviewBlock>
      </div>

      {!showCheckout && (
        <>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-secondary" onClick={onBack}>Back</button>
            <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={() => setShowCheckout(true)}>
              Continue to Payment
            </button>
          </div>
        </>
      )}

      {showCheckout && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Payment</h3>
          {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
          {!clientSecret && !error && <p style={{ color: 'var(--gray)' }}>Loading payment form…</p>}
          {clientSecret && (
            <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
          <button type="button" className="btn-secondary" style={{ marginTop: 16 }} onClick={() => setShowCheckout(false)}>
            Back to Review
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <h4 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--orange)', marginBottom: 12 }}>
        {title}
      </h4>
      <div style={{ display: 'grid', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}>
      <span style={{ color: 'var(--gray)' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{value}</span>
    </div>
  );
}
