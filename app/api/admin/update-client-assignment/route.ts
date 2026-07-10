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
  if (typeof clientId !== 'string') {
    return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
  }

  const update: Record<string, string | null> = {};
  if ('twilioNumber' in (body ?? {})) update.twilio_number = toE164(body.twilioNumber);
  if ('vapiAgentId' in (body ?? {})) update.vapi_agent_id = body.vapiAgentId?.trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const db = adminDb();
  const { error } = await db.from('clients').update(update).eq('id', clientId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
