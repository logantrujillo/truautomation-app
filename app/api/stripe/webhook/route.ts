import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail, sendLoganNewClientNotification } from '@/lib/email';
import type Stripe from 'stripe';

// Stripe webhook: on successful checkout, flips the client to 'active',
// stores subscription/item IDs (needed later for metered usage
// reporting), and fires the welcome + internal notification emails.
// Uses the service-role Supabase client since this runs with no user
// session — it's Stripe calling our server directly.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const clientId = session.metadata?.client_id;

    if (!clientId) {
      console.error('checkout.session.completed with no client_id in metadata', session.id);
      return NextResponse.json({ received: true });
    }

    const db = createAdminClient();
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    let meteredItemId: string | null = null;
    let setupItemId: string | null = null;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      for (const item of subscription.items.data) {
        if (item.price.recurring?.usage_type === 'metered') {
          meteredItemId = item.id;
        } else {
          setupItemId = item.id;
        }
      }
    }

    const { data: client, error: updateError } = await db
      .from('clients')
      .update({
        status: 'active',
        stripe_subscription_id: subscriptionId ?? null,
        stripe_metered_item_id: meteredItemId,
        stripe_setup_item_id: setupItemId,
      })
      .eq('id', clientId)
      .select('*')
      .single();

    if (updateError || !client) {
      console.error('Failed to activate client after payment', clientId, updateError);
      return NextResponse.json({ received: true });
    }

    const { data: faqs } = await db.from('faqs').select('question, answer').eq('client_id', clientId);

    try {
      await sendWelcomeEmail(client);
      await sendLoganNewClientNotification(client, faqs ?? []);
    } catch (emailErr) {
      // Don't fail the webhook over email delivery — Stripe will retry
      // the whole event otherwise, and the account is already active.
      console.error('Post-payment email failed', emailErr);
    }
  }

  return NextResponse.json({ received: true });
}
