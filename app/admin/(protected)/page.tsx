import { adminDb } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import type { PlanId } from '@/lib/types';
import AssignNumberSelect from '@/components/admin/AssignNumberSelect';
import SyncTwilioButton from '@/components/admin/SyncTwilioButton';
import Link from 'next/link';

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function AdminDashboard() {
  const db = adminDb();

  const { data: clients } = await db.from('clients').select('*').order('created_at', { ascending: false });
  const { data: numbers } = await db.from('twilio_numbers').select('*').order('phone_number');
  const { data: allCalls } = await db.from('calls').select('client_id, duration_seconds, started_at').gte('started_at', startOfMonthISO());

  const usageByClient = new Map<string, number>();
  for (const call of allCalls ?? []) {
    usageByClient.set(call.client_id, (usageByClient.get(call.client_id) ?? 0) + (call.duration_seconds ?? 0));
  }

  const activeClients = (clients ?? []).filter((c) => c.status === 'active');
  let totalMonthlyUsageRevenue = 0;
  for (const client of activeClients) {
    const seconds = usageByClient.get(client.id) ?? 0;
    const minutes = seconds / 60;
    const plan = client.plan ? PLANS[client.plan as PlanId] : null;
    if (plan) totalMonthlyUsageRevenue += minutes * plan.perMinute;
  }
  const totalSetupRevenue = activeClients.length * 679;

  const availableNumbers = (numbers ?? []).filter((n) => !n.assigned_client_id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 32 }}>Clients</h1>
        <SyncTwilioButton />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Active Clients" value={String(activeClients.length)} />
        <StatCard label="Usage Revenue (This Month)" value={`$${totalMonthlyUsageRevenue.toFixed(2)}`} />
        <StatCard label="Total Setup Fees Collected" value={`$${totalSetupRevenue.toFixed(2)}`} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Usage (mo)</th>
              <th>Twilio Number</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map((c) => {
              const seconds = usageByClient.get(c.id) ?? 0;
              const minutes = Math.round((seconds / 60) * 10) / 10;
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/clients/${c.id}`} style={{ color: 'var(--orange)', textDecoration: 'none' }}>
                      {c.business_name || c.email}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'active' : c.status === 'suspended' ? 'suspended' : 'pending'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{c.plan ? PLANS[c.plan as PlanId].label : '—'}</td>
                  <td>{minutes} min</td>
                  <td>{c.twilio_number || '—'}</td>
                  <td>
                    <AssignNumberSelect clientId={c.id} currentNumber={c.twilio_number} availableNumbers={availableNumbers.map((n) => n.phone_number)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
