import { createClient } from '@/lib/supabase/server';
import { getCurrentClient } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/lib/types';
import FormattedDateTime from '@/components/FormattedDateTime';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function DashboardOverview() {
  const client = await getCurrentClient();
  if (!client) return null;

  const supabase = await createClient();

  const [{ data: recentCalls }, { data: appointments }] = await Promise.all([
    supabase
      .from('calls')
      .select('id, caller_name, caller_number, started_at, summary')
      .eq('client_id', client.id)
      .order('started_at', { ascending: false })
      .limit(25),
    supabase
      .from('appointments')
      .select('id, customer_name, service, scheduled_at, customer_phone')
      .eq('client_id', client.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10),
  ]);

  const usageMinutes = client.manual_minutes_used ?? 0;
  const plan = client.plan ? PLANS[client.plan as PlanId] : null;
  const estimatedCost = plan ? (usageMinutes * plan.perMinute).toFixed(2) : '0.00';

  return (
    <div>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Overview</h1>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Your Alex Number" value={client.twilio_number || 'Pending assignment'} />
        <StatCard label="Plan" value={plan ? `${plan.label} · $${plan.perMinute.toFixed(2)}/min` : '—'} />
        <StatCard label="Usage This Month" value={`${usageMinutes} min ($${estimatedCost})`} />
        <StatCard label="Appointments Booked This Month" value={String(client.manual_appointments_booked ?? 0)} />
        <StatCard label="Total Calls Handled This Month" value={String(client.manual_calls_handled ?? 0)} />
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Upcoming Appointments</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          {!appointments || appointments.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>No upcoming appointments yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date/Time</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.customer_name || '—'}</td>
                    <td>{a.service || '—'}</td>
                    <td><FormattedDateTime iso={a.scheduled_at} /></td>
                    <td>{a.customer_phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Recent Calls</h2>
        <div className="card" style={{ overflow: 'hidden' }}>
          {!recentCalls || recentCalls.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>
              No calls logged yet. Once your number is assigned and Alex starts taking calls, they&apos;ll show up here.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Date/Time</th>
                  <th>Transcript</th>
                </tr>
              </thead>
              <tbody>
                {recentCalls.map((c) => (
                  <tr key={c.id}>
                    <td>{c.caller_name || c.caller_number || 'Unknown'}</td>
                    <td><FormattedDateTime iso={c.started_at} /></td>
                    <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{c.summary || '—'}</td>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--gray)', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 600 }}>{value}</p>
    </div>
  );
}
