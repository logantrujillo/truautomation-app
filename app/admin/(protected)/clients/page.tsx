import Link from 'next/link';
import { adminDb } from '@/lib/auth';
import { PLANS } from '@/lib/plans';
import { getReceptionistBrand } from '@/lib/brand';
import type { PlanId } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminClientList() {
  const db = adminDb();
  const { data: clients } = await db.from('clients').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: 32, marginBottom: 24 }}>Clients</h1>

      <div className="card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name / Business</th>
              <th>Email</th>
              <th>AI Receptionist</th>
              <th>Plan</th>
              <th>Signup Date</th>
              <th>Status</th>
              <th>Twilio Number</th>
              <th>VAPI Agent ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.business_name || '—'}</div>
                  <div style={{ color: 'var(--gray)', fontSize: 13 }}>{c.contact_name || ''}</div>
                </td>
                <td>{c.email}</td>
                <td>{getReceptionistBrand(c.industry)}</td>
                <td>{c.plan ? PLANS[c.plan as PlanId].label : '—'}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${c.status === 'active' ? 'active' : c.status === 'suspended' ? 'suspended' : 'pending'}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{c.twilio_number || 'Not assigned'}</td>
                <td>{c.vapi_agent_id || 'Not assigned'}</td>
                <td>
                  <Link href={`/admin/clients/${c.id}`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(!clients || clients.length === 0) && (
              <tr>
                <td colSpan={9} style={{ color: 'var(--gray)', textAlign: 'center', padding: 24 }}>
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
