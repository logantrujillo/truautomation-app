import Link from 'next/link';
import { adminDb } from '@/lib/auth';
import { PLANS, SETUP_FEE } from '@/lib/plans';
import type { PlanId } from '@/lib/types';

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function sevenDaysAgoISO() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminOverview() {
  const db = adminDb();

  const { data: clients } = await db.from('clients').select('*').order('created_at', { ascending: false });
  const { data: monthCalls } = await db
    .from('calls')
    .select('client_id, duration_seconds')
    .gte('started_at', startOfMonthISO());

  const usageByClient = new Map<string, number>();
  for (const call of monthCalls ?? []) {
    usageByClient.set(call.client_id, (usageByClient.get(call.client_id) ?? 0) + (call.duration_seconds ?? 0));
  }

  const allClients = clients ?? [];
  const activeClients = allClients.filter((c) => c.status === 'active');

  let totalMinutesThisMonth = 0;
  let totalUsageRevenueThisMonth = 0;
  for (const client of activeClients) {
    const seconds = usageByClient.get(client.id) ?? 0;
    const minutes = seconds / 60;
    totalMinutesThisMonth += minutes;
    const plan = client.plan ? PLANS[client.plan as PlanId] : null;
    if (plan) totalUsageRevenueThisMonth += minutes * plan.perMinute;
  }

  const monthStart = startOfMonthISO();
  const newSetupFeesThisMonth = activeClients.filter((c) => c.created_at >= monthStart).length * SETUP_FEE;
  const totalRevenueThisMonth = totalUsageRevenueThisMonth + newSetupFeesThisMonth;

  const pendingAssignment = allClients.filter(
    (c) => c.status !== 'suspended' && (!c.twilio_number || !c.vapi_agent_id)
  );

  const sevenDaysAgo = sevenDaysAgoISO();
  const recentSignups = allClients.filter((c) => c.created_at >= sevenDaysAgo);

  return (
    <div>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Overview</h1>

      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <StatCard label="Active Clients" value={String(activeClients.length)} />
        <StatCard label="Revenue This Month" value={`$${totalRevenueThisMonth.toFixed(2)}`} />
        <StatCard label="Minutes Used This Month" value={`${Math.round(totalMinutesThisMonth * 10) / 10} min`} />
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Pending Twilio / VAPI Assignment</h2>
        <div className="card table-scroll">
          {pendingAssignment.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>All active clients are fully assigned.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Status</th>
                  <th>Twilio Number</th>
                  <th>VAPI Agent ID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pendingAssignment.map((c) => (
                  <tr key={c.id}>
                    <td>{c.business_name || c.email}</td>
                    <td>
                      <span className={`badge ${c.status === 'active' ? 'active' : 'pending'}`}>{c.status.replace('_', ' ')}</span>
                    </td>
                    <td>{c.twilio_number || <span style={{ color: 'var(--red)' }}>Not assigned</span>}</td>
                    <td>{c.vapi_agent_id || <span style={{ color: 'var(--red)' }}>Not assigned</span>}</td>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 14 }}>
                        Assign &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>Recent Signups (Last 7 Days)</h2>
        <div className="card table-scroll">
          {recentSignups.length === 0 ? (
            <p style={{ padding: 24, color: 'var(--gray)', fontSize: 14 }}>No new signups in the last 7 days.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Signed Up</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((c) => (
                  <tr key={c.id}>
                    <td>{c.business_name || '—'}</td>
                    <td>{c.email}</td>
                    <td>{c.plan ? PLANS[c.plan as PlanId].label : '—'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/admin/clients/${c.id}`} style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 14 }}>
                        View &rarr;
                      </Link>
                    </td>
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
