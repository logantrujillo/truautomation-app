import { NextResponse } from 'next/server';
import { isAdminSessionValid } from '@/lib/adminAuth';
import { adminDb } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

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

  const db = adminDb();

  const { data: client, error: fetchError } = await db
    .from('clients')
    .select('id, status, stripe_subscription_id')
    .eq('id', clientId)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (client.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(client.stripe_subscription_id);
    } catch (err) {
      // Subscription may already be canceled/absent — don't block deletion on this.
      console.error('Stripe subscription cancel failed during client delete:', err);
    }
  }

  // Deleting the auth user cascades to clients, services, faqs, calls,
  // appointments, and google_tokens (all `on delete cascade`).
  const { error: deleteError } = await db.auth.admin.deleteUser(clientId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
