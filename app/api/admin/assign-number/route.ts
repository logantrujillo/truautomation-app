import { NextResponse } from 'next/server';
import { requireAdmin, adminDb } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { clientId, phoneNumber } = await request.json();
  if (!clientId || !phoneNumber) {
    return NextResponse.json({ error: 'clientId and phoneNumber are required' }, { status: 400 });
  }

  const db = adminDb();

  // Free up any number previously assigned to this client.
  await db.from('twilio_numbers').update({ assigned_client_id: null }).eq('assigned_client_id', clientId);

  const { error: assignError } = await db
    .from('twilio_numbers')
    .update({ assigned_client_id: clientId })
    .eq('phone_number', phoneNumber);

  if (assignError) {
    return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  const { error: clientError } = await db.from('clients').update({ twilio_number: phoneNumber }).eq('id', clientId);
  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
