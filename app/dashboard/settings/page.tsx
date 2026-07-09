'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { BusinessHours } from '@/lib/types';

interface ServiceRow {
  id?: string;
  name: string;
  description: string;
}
interface FaqRow {
  id?: string;
  question: string;
  answer: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');
  const [alexInstructions, setAlexInstructions] = useState('');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: client } = await supabase.from('clients').select('*').eq('id', user.id).single();
      if (client) {
        setBusinessName(client.business_name ?? '');
        setPhone(client.phone ?? '');
        setIndustry(client.industry ?? '');
        setAddress(client.address ?? '');
        setAlexInstructions(client.alex_instructions ?? '');
        setBusinessHours(client.business_hours ?? {});
      }

      const { data: googleTokenRow } = await supabase.from('google_tokens').select('client_id').eq('client_id', user.id).maybeSingle();
      setGoogleConnected(!!googleTokenRow || searchParams.get('google') === 'connected');

      const { data: serviceRows } = await supabase.from('services').select('*').eq('client_id', user.id);
      setServices(serviceRows && serviceRows.length > 0 ? serviceRows : [{ name: '', description: '' }]);

      const { data: faqRows } = await supabase.from('faqs').select('*').eq('client_id', user.id);
      setFaqs(faqRows && faqRows.length > 0 ? faqRows : [{ question: '', answer: '' }]);

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);

    await fetch('/api/client/update-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName,
        phone,
        industry,
        address,
        alexInstructions,
        businessHours,
        services,
        faqs,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <p style={{ color: 'var(--gray)' }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Settings</h1>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Business Info</h2>
        <div className="field">
          <label>Business Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Industry</label>
          <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="Plumbing">Plumbing</option>
            <option value="HVAC">HVAC</option>
            <option value="Electrical">Electrical</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Business Hours</h2>
        {DAYS.map((day) => {
          const hours = businessHours[day] ?? { open: '08:00', close: '17:00', closed: true };
          return (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 44, fontSize: 14, fontWeight: 600 }}>{day}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0, textTransform: 'none' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={!hours.closed}
                  onChange={(e) => setBusinessHours({ ...businessHours, [day]: { ...hours, closed: !e.target.checked } })}
                />
                <span style={{ fontSize: 13, color: 'var(--gray)' }}>Open</span>
              </label>
              {!hours.closed && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => setBusinessHours({ ...businessHours, [day]: { ...hours, open: e.target.value } })}
                    style={{ width: 120 }}
                  />
                  <span style={{ color: 'var(--gray)' }}>to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => setBusinessHours({ ...businessHours, [day]: { ...hours, close: e.target.value } })}
                    style={{ width: 120 }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Services</h2>
        {services.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <input
                placeholder="Service name"
                value={s.name}
                onChange={(e) => setServices(services.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))}
                style={{ marginBottom: 8 }}
              />
              <input
                placeholder="Description"
                value={s.description}
                onChange={(e) => setServices(services.map((row, idx) => (idx === i ? { ...row, description: e.target.value } : row)))}
              />
            </div>
            <button type="button" className="btn-secondary" onClick={() => setServices(services.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setServices([...services, { name: '', description: '' }])}>
          + Add Service
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Alex Setup</h2>
        <div className="field">
          <label>Special Instructions</label>
          <textarea rows={4} value={alexInstructions} onChange={(e) => setAlexInstructions(e.target.value)} />
        </div>
        <h3 style={{ fontSize: 14, margin: '16px 0 12px', color: 'var(--gray)', textTransform: 'uppercase' }}>FAQs</h3>
        {faqs.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <input
                placeholder="Question"
                value={f.question}
                onChange={(e) => setFaqs(faqs.map((row, idx) => (idx === i ? { ...row, question: e.target.value } : row)))}
                style={{ marginBottom: 8 }}
              />
              <textarea
                placeholder="Answer"
                rows={2}
                value={f.answer}
                onChange={(e) => setFaqs(faqs.map((row, idx) => (idx === i ? { ...row, answer: e.target.value } : row)))}
              />
            </div>
            <button type="button" className="btn-secondary" onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn-secondary" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
          + Add FAQ
        </button>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Google Integration</h2>
          <p style={{ fontSize: 13, color: 'var(--gray)' }}>{googleConnected ? 'Connected ✓' : 'Not connected'}</p>
        </div>
        <a href="/api/auth/google?from=dashboard" className="btn-secondary">
          {googleConnected ? 'Reconnect' : 'Connect Google'}
        </a>
      </div>

      <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
      </button>
    </div>
  );
}
