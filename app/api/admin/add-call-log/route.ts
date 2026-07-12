import { NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminAuth';
import { adminDb } from '@/lib/auth';
import { toE164 } from '@/lib/phone';

export async function POST(request: Request) {
  const valid = await isAdminSessionValid();
  if (!valid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const clientId = body?.clientId;
  const callerNumber = typeof body?.callerNumber === 'string' ? body.callerNumber.trim() : '';
  const transcript = typeof body?.transcript === 'string' ? body.transcript.trim() : '';

  if (typeof clientId !== 'string') {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }
  if (!callerNumber) {
    return NextResponse.json({ error: "Caller's number is required" }, { status: 400 });
  }

  const db = adminDb();
  const { error } = await db.from('calls').insert({
    client_id: clientId,
    caller_number: toE164(callerNumber),
    transcript: transcript || null,
    started_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
