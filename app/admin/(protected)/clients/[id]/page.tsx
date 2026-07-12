import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import type { BusinessHours, PlanId } from '@/lib/types';
import ClientAssignmentForm from '@/components/admin/ClientAssignmentForm';
import ClientStatsForm from '@/components/admin/ClientStatsForm';
import CallLogForm from '@/components/admin/CallLogForm';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
  const { data: googleToken } = await db.from('google_tokens').select('client_id').eq('client_id', id).maybeSingle();

  const plan = client.plan ? PLANS[client.plan as PlanId] : null;
  const businessHours = (client.business_hours as BusinessHours | null) ?? {};

  const monthMinutes = client.manual_minutes_used ?? 0;
  const estimatedBill = plan ? (monthMinutes * plan.perMinute).toFixed(2) : '0.00';

  return (
    <div>
      <Link href="/admin/clients" style={{ color: 'var(--gray)', fontSize: 13, textDecoration: 'none' }}>&larr; Back to Clients</Link>
      <h1 style={{ fontSize: 32, margin: '12px 0 24px' }}>{client.business_name || client.email}</h1>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <InfoCard label="Status" value={client.status.replace('_', ' ')} />
        <InfoCard label="Plan" value={plan ? `${plan.label} · $${plan.perMinute}/min` : '—'} />
        <InfoCard label="Usage This Month" value={`${monthMinutes} min ($${estimatedBill})`} />
        <InfoCard label="Appointments Booked" value={String(client.manual_appointments_booked ?? 0)} />
        <InfoCard label="Total Calls Handled" value={String(client.manual_calls_handled ?? 0)} />
        <InfoCard label="Contact" value={`${client.contact_name || ''} · ${client.phone || ''}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
        <ClientAssignmentForm clientId={client.id} initialTwilioNumber={client.twilio_number} initialVapiAgentId={client.vapi_agent_id} />

        <ClientStatsForm
          clientId={client.id}
          initialMinutesUsed={client.manual_minutes_used ?? 0}
          initialAppointmentsBooked={client.manual_appointments_booked ?? 0}
          initialCallsHandled={client.manual_calls_handled ?? 0}
        />

        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Business Info</h2>
          <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
            <Row label="Business Name" value={client.business_name || '—'} />
            <Row label="Address" value={client.address || '—'} />
            <Row label="Industry" value={client.industry || '—'} />
            <Row label="Email" value={client.email} />
            <Row label="Google Integration" value={googleToken ? 'Connected' : 'Not connected'} />
          </div>
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Business Hours</h2>
        <div className="card" style={{ padding: 20 }}>
          {DAYS.map((day) => {
            const hours = businessHours[day];
            return (
              <div key={day} style={{ display: 'flex', gap: 16, fontSize: 14, marginBottom: 6 }}>
                <span style={{ width: 44, fontWeight: 600 }}>{day}</span>
                <span style={{ color: 'var(--gray)' }}>
                  {!hours || hours.closed ? 'Closed' : `${hours.open} – ${hours.close}`}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Alex Instructions</h2>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: client.alex_instructions ? 'var(--white)' : 'var(--gray)' }}>
            {client.alex_instructions || 'None provided'}
          </p>
        </div>
      </section>

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
        <CallLogForm clientId={client.id} />
        <div className="card table-scroll">
          {!calls || calls.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>No calls logged yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Caller&apos;s Number</th>
                  <th>Date/Time</th>
                  <th>Duration</th>
                  <th>Outcome</th>
                  <th>Transcript</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.id}>
                    <td>{c.caller_name || c.caller_number || 'Unknown'}</td>
                    <td>{c.started_at ? new Date(c.started_at).toLocaleString() : '—'}</td>
                    <td>{formatDuration(c.duration_seconds ?? 0)}</td>
                    <td>{c.outcome || '—'}</td>
                    <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{c.transcript || c.summary || '—'}</td>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ color: 'var(--gray)' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{value}</span>
    </div>
  );
}
