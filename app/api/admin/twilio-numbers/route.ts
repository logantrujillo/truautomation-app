import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { requireAdmin, adminDb } from '@/lib/auth';

// Pulls the list of phone numbers Logan has already purchased in Twilio
// and mirrors them into the twilio_numbers table so the admin dashboard
// has a pool to assign from. Does not purchase new numbers.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const numbers = await client.incomingPhoneNumbers.list({ limit: 200 });

  const db = adminDb();
  for (const n of numbers) {
    await db
      .from('twilio_numbers')
      .upsert({ phone_number: n.phoneNumber, friendly_name: n.friendlyName }, { onConflict: 'phone_number' });
  }

  return NextResponse.json({ synced: numbers.length });
}
