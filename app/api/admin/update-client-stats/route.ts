import { NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminAuth';
import { adminDb } from '@/lib/auth';

export async function POST(request: Request) {
  const valid = await isAdminSessionValid();
  if (!valid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clientId = body?.clientId;
  if (typeof clientId !== 'string') {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  const minutesUsed = Number(body?.minutesUsed);
  const appointmentsBooked = Number(body?.appointmentsBooked);
  const callsHandled = Number(body?.callsHandled);

  if (![minutesUsed, appointmentsBooked, callsHandled].every((n) => Number.isFinite(n) && n >= 0)) {
    return NextResponse.json({ error: 'Values must be numbers greater than or equal to 0' }, { status: 400 });
  }

  const db = adminDb();
  const { error } = await db
    .from('clients')
    .update({
      manual_minutes_used: minutesUsed,
      manual_appointments_booked: appointmentsBooked,
      manual_calls_handled: callsHandled,
    })
    .eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
