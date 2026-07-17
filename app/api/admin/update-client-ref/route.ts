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

  const clientRef = typeof body?.clientRef === 'string' ? body.clientRef.trim() || null : null;

  const db = adminDb();
  const { error } = await db.from('clients').update({ client_ref: clientRef }).eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
