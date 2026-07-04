import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/lib/types';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function AdminClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = adminDb();

  const { data: client } = await db.from('clients').select('*').eq('id', id).single();
  if (!client) notFound();

  const { data: calls } = await db.from('calls').select('*').eq('client_id', id).order('started_at', { ascending: false });
  const { data: faqs } = await db.from('faqs').select('*').eq('client_id', id);
  const { data: services } = await db.from('services').select('*').eq('client_id', id);

  const plan = client.plan ? PLANS[client.plan as PlanId] : null;

  return (
    <div>
      <Link href="/admin" style={{ color: 'var(--gray)', fontSize: 13, textDecoration: 'none' }}>&larr; Back to Clients</Link>
      <h1 style={{ fontSize: 32, margin: '12px 0 24px' }}>{client.business_name || client.email}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <InfoCard label="Status" value={client.status.replace('_', ' ')} />
        <InfoCard label="Plan" value={plan ? `${plan.label} · $${plan.perMinute}/min` : '—'} />
        <InfoCard label="Twilio Number" value={client.twilio_number || 'Unassigned'} />
        <InfoCard label="Contact" value={`${client.contact_name || ''} · ${client.phone || ''}`} />
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Services</h2>
        <div className="card" style={{ padding: 20 }}>
          {!services || services.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>None configured</p>
          ) : (
            services.map((s) => (
              <div key={s.id} style={{ marginBottom: 8 }}>
                <strong>{s.name}</strong>
                {s.description && <span style={{ color: 'var(--gray)' }}> — {s.description}</span>}
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>FAQ Entries</h2>
        <div className="card" style={{ padding: 20 }}>
          {!faqs || faqs.length === 0 ? (
            <p style={{ color: 'var(--gray)', fontSize: 14 }}>None configured</p>
          ) : (
            faqs.map((f) => (
              <div key={f.id} style={{ marginBottom: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{f.question}</p>
                <p style={{ color: 'var(--gray)', fontSize: 14 }}>{f.answer}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Full Call Log</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          {!calls || calls.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>No calls logged yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Date/Time</th>
                  <th>Duration</th>
                  <th>Outcome</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id}>
                    <td>{c.caller_name || c.caller_number || 'Unknown'}</td>
                    <td>{c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</td>
                    <td>{formatDuration(c.duration_seconds ?? 0)}</td>
                    <td>{c.outcome || '—'}</td>
                    <td>{c.summary || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--gray)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 600 }}>{value}</p>
    </div>
  );
}
