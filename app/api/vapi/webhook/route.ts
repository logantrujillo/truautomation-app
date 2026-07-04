import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CallOutcome } from '@/lib/types';

// VAPI server webhook — logs completed calls to the correct client based
// on which Twilio number was called, and creates an appointment row if
// the call resulted in a booking.
//
// IMPORTANT: this parser is written defensively because the exact shape
// of VAPI's "end-of-call-report" payload can vary by account/assistant
// config and API version. Field lookups below try several common paths
// and fall back gracefully. If calls aren't logging correctly, add a
// temporary console.log(JSON.stringify(payload)) here, trigger a real
// call, check the Vercel function logs for the actual shape, and adjust
// the `extract*` helpers accordingly.
export async function POST(request: Request) {
  const secret = request.headers.get('x-vapi-secret');
  if (process.env.VAPI_WEBHOOK_SECRET && secret !== process.env.VAPI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const message = payload?.message ?? payload;

  // Only act on the final call summary event; VAPI also sends
  // intermediate events (status-update, transcript, etc.) we ignore.
  if (message?.type && message.type !== 'end-of-call-report') {
    return NextResponse.json({ received: true, ignored: message.type });
  }

  const call = message?.call ?? payload?.call ?? {};
  const analysis = message?.analysis ?? call?.analysis ?? {};

  const twilioNumber = extractCalledNumber(call);
  const callerNumber = extractCallerNumber(call);

  if (!twilioNumber) {
    console.error('VAPI webhook: could not determine which number was called', JSON.stringify(payload));
    return NextResponse.json({ received: true, error: 'no phone number found' });
  }

  const db = createAdminClient();

  const { data: client } = await db.from('clients').select('id').eq('twilio_number', twilioNumber).single();

  if (!client) {
    console.error('VAPI webhook: no client assigned to number', twilioNumber);
    return NextResponse.json({ received: true, error: 'no client for number' });
  }

  const startedAt = call.startedAt ?? message.startedAt ?? null;
  const endedAt = call.endedAt ?? message.endedAt ?? null;
  const durationSeconds =
    call.durationSeconds ??
    (startedAt && endedAt ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000) : 0);

  const outcome = extractOutcome(analysis, message);
  const summary = analysis?.summary ?? message?.summary ?? null;
  const callerName = call?.customer?.name ?? null;
  const vapiCallId = call?.id ?? message?.callId ?? null;

  const { data: insertedCall, error: callError } = await db
    .from('calls')
    .upsert(
      {
        client_id: client.id,
        vapi_call_id: vapiCallId,
        twilio_number: twilioNumber,
        caller_number: callerNumber,
        caller_name: callerName,
        started_at: startedAt,
        duration_seconds: durationSeconds,
        outcome,
        summary,
      },
      { onConflict: 'vapi_call_id' }
    )
    .select('id')
    .single();

  if (callError) {
    console.error('VAPI webhook: failed to insert call', callError);
    return NextResponse.json({ received: true, error: callError.message });
  }

  // If structured data includes a booking, create an appointment too.
  const booking = analysis?.structuredData?.appointment ?? analysis?.structuredData?.booking ?? null;
  if (outcome === 'booked' && booking) {
    await db.from('appointments').insert({
      client_id: client.id,
      call_id: insertedCall?.id ?? null,
      customer_name: callerName ?? booking.customerName ?? null,
      customer_phone: callerNumber,
      scheduled_at: booking.scheduledAt ?? booking.time ?? null,
      service: booking.service ?? null,
      notes: booking.notes ?? null,
    });
  }

  return NextResponse.json({ received: true });
}

function extractCalledNumber(call: any): string | null {
  return (
    call?.phoneNumber?.number ??
    call?.phoneNumberId ??
    call?.assistantPhoneNumber ??
    call?.to ??
    call?.twilioPhoneNumber ??
    null
  );
}

function extractCallerNumber(call: any): string | null {
  return call?.customer?.number ?? call?.from ?? call?.caller ?? null;
}

function extractOutcome(analysis: any, message: any): CallOutcome {
  const raw =
    analysis?.structuredData?.outcome ??
    analysis?.outcome ??
    message?.endedReason ??
    '';

  const normalized = String(raw).toLowerCase();
  if (normalized.includes('book')) return 'booked';
  if (normalized.includes('cancel')) return 'cancelled';
  if (normalized.includes('escalat') || normalized.includes('transfer')) return 'escalated';
  return 'inquiry';
}
