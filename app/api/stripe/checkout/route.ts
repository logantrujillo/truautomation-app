import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { PLANS, SETUP_FEE } from '@/lib/plans';
import type { PlanId } from '@/lib/types';

// Creates an embedded Stripe Checkout Session combining the one-time
// $679 setup fee with a recurring metered per-minute price, in a single
// subscription-mode session. Card data never touches our server —
// Stripe's Embedded Checkout component collects it directly.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', user.id)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  if (!client.plan) {
    return NextResponse.json({ error: 'No plan selected yet' }, { status: 400 });
  }

  const plan = PLANS[client.plan as PlanId];
  const meteredPriceId = process.env[plan.meteredPriceEnvVar];
  const setupFeePriceId = process.env[plan.setupFeePriceEnvVar];

  if (!meteredPriceId || !setupFeePriceId) {
    return NextResponse.json({ error: 'Stripe price IDs are not configured' }, { status: 500 });
  }

  let customerId = client.stripe_customer_id as string | null;

  // If a customer ID exists, confirm it's valid for the current Stripe key's
  // mode (test vs live). A mismatched-mode ID (e.g. left over from switching
  // test/live keys) causes checkout session creation to fail, so we detect
  // and clear it here rather than let the call throw further down.
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null;
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: client.email,
      name: client.business_name ?? client.contact_name ?? undefined,
      metadata: { client_id: client.id },
    });
    customerId = customer.id;
    await supabase.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      customer: customerId,
      line_items: [
        { price: setupFeePriceId, quantity: 1 },
        { price: meteredPriceId },
      ],
      subscription_data: {
        metadata: { client_id: client.id, plan: client.plan },
      },
      metadata: { client_id: client.id, plan: client.plan },
      redirect_on_completion: 'always',
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup/success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({
      clientSecret: session.client_secret,
      setupFee: SETUP_FEE,
      perMinute: plan.perMinute,
      planLabel: plan.label,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not create checkout session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
