# TruAutomation Client Portal

A Next.js app providing account signup, client dashboard, and admin dashboard
for TruAutomation's Alex AI receptionist customers. Runs alongside (not
instead of) the existing static marketing site — link to this app's `/signup`
and `/login` pages from the marketing site once deployed.

## Stack

- **Next.js 14** (App Router) — deploy to **Vercel**
- **Supabase** — auth, Postgres database, Row Level Security
- **Stripe** — Embedded Checkout (one-time setup fee + metered per-minute subscription)
- **Google OAuth** — Calendar access per client
- **Twilio** — assigning existing purchased numbers to clients
- **Resend** — transactional emails (welcome email, new-client notification)
- **VAPI** — webhook that logs completed calls

## 1. Supabase setup

1. Create a project at supabase.com.
2. Project Settings → API: copy the Project URL, `anon` key, and `service_role` key into `.env.local`.
3. SQL Editor → New query → paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) → Run.
4. **Auth → Providers → Email**: turn **OFF** "Confirm email". This flow creates the auth
   user at Step 1 of signup and needs an active session immediately to save progress
   through the rest of the wizard, well before the user ever sees an email. Stripe
   payment at the end effectively gates real access anyway (see `status` below).
5. `/admin` is **not** part of Supabase auth — it's gated by a separate
   hardcoded username/password (see `lib/adminAuth.ts`). Nothing to set up here.
6. If upgrading an existing project (rather than a fresh install), run this
   one-line migration in the SQL Editor to add the VAPI Agent ID column:
   ```sql
   alter table public.clients add column if not exists vapi_agent_id text;
   ```

## 2. Stripe setup

1. Create four Prices in the Stripe Dashboard (Product catalog):
   - One-time price, $679 — **setup fee for After Hours**
   - One-time price, $679 — **setup fee for 24/7**
   - Recurring price, **usage_type: metered**, $0.42/unit (1 unit = 1 minute) — **After Hours**
   - Recurring price, **usage_type: metered**, $0.47/unit — **24/7**
   - (Each plan has its own setup fee Price ID, even though the dollar amount is the same for both — this keeps Stripe reporting/reconciliation per-plan. All four can live on one Product or separate Products — doesn't matter, only the Price IDs matter.)
2. Copy the four Price IDs into `.env.local` (`STRIPE_PRICE_SETUP_FEE_AFTER_HOURS`, `STRIPE_PRICE_SETUP_FEE_247`, `STRIPE_PRICE_AFTER_HOURS_METERED`, `STRIPE_PRICE_247_METERED`).
3. Copy your Stripe secret key + publishable key into `.env.local`.
4. **Webhook**: Developers → Webhooks → Add endpoint → URL: `https://<your-domain>/api/stripe/webhook`,
   event: `checkout.session.completed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **Reporting usage**: once a client's account is active, report their per-minute usage
   with `stripe.subscriptionItems.createUsageRecord(client.stripe_metered_item_id, { quantity: minutes })`
   — call this from wherever call-duration data lands (e.g. right after the VAPI webhook
   logs a call, or on a nightly cron). This isn't wired up automatically yet since it
   depends on how precisely you want to bill (per-call vs. daily batch); the `calls` table
   already has everything needed to compute it.

## 3. Google OAuth setup

1. Google Cloud Console → new project → **APIs & Services → Enabled APIs**: enable
   Google Calendar API.
2. **OAuth consent screen**: set up as External (or Internal if using Workspace),
   add scope `.../auth/calendar`.
3. **Credentials → Create OAuth client ID** (Web application). Add an authorized
   redirect URI: `https://<your-domain>/api/auth/google/callback` (and
   `http://localhost:3000/api/auth/google/callback` for local dev).
4. Copy Client ID / Client Secret into `.env.local`.

## 4. Twilio

No new setup needed beyond what you already have — assign a purchased Twilio
number to each client directly from their client detail page in `/admin`.

## 5. Resend (email)

Sign up at resend.com, verify your sending domain, create an API key, add it
as `RESEND_API_KEY`. `EMAIL_FROM` should be an address on your verified domain.

## 6. VAPI webhook

Point your VAPI assistant's server webhook URL at
`https://<your-domain>/api/vapi/webhook`, and set a custom header
`x-vapi-secret: <same value as VAPI_WEBHOOK_SECRET>` if VAPI's config supports
custom headers (otherwise leave `VAPI_WEBHOOK_SECRET` blank in `.env.local` to
skip verification — not recommended for production).

**Known unknown:** I don't have access to a live VAPI account, so
[`app/api/vapi/webhook/route.ts`](app/api/vapi/webhook/route.ts) parses the
payload defensively with fallbacks, but the exact field names may not match
your real payload. If calls aren't appearing on dashboards after a real test
call, check the Vercel function logs (the route logs errors when it can't
find a matching phone number) and adjust the `extractCalledNumber` /
`extractCallerNumber` / `extractOutcome` helpers to match what you actually
see.

## 7. Local development

```bash
npm install
cp .env.local.example .env.local   # fill in all values from steps above
npm run dev
```

## 8. Deploying to Vercel

1. Push this folder to a new GitHub repo (or drag-and-drop deploy via Vercel CLI).
2. Import the repo in Vercel, add all variables from `.env.local` as
   Environment Variables in the Vercel project settings.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL (e.g. `https://app.truautomationtechnologies.com`).
4. Update the Stripe webhook URL and Google OAuth redirect URI to the production domain.
5. Deploy. Once live, link to `https://<your-domain>/signup` from the "Get Started" /
   pricing buttons on the marketing site.

## How account status works

Every client row has a `status`:
- `pending_onboarding` — signed up (Step 1 of 7), still filling out the wizard.
- `pending_payment` — reached Step 7 but hasn't completed Stripe checkout yet.
- `active` — payment confirmed by the Stripe webhook. Only `active` clients can
  reach `/dashboard` (enforced in `app/dashboard/layout.tsx`) or get a Twilio number.
- `suspended` — for future use if you ever need to manually cut off access
  (not currently wired to any UI action — flip it directly in Supabase if needed).

## Security notes

- Passwords are hashed by Supabase Auth the moment Step 1 of signup completes —
  this app never stores or sees a plaintext password beyond that request.
- Row Level Security is enabled on every table. Clients can only read/write
  rows where `auth.uid()` matches their own `client_id`. `calls` and
  `appointments` are read-only for clients — only server-side webhooks
  (using the service-role key) can write to them.
- `google_tokens` has zero RLS policies granted to any role — only the
  service-role key (used server-side only, in `lib/supabase/admin.ts`) can
  ever read or write it.
- `/admin` is gated by a hardcoded username/password (`lib/adminAuth.ts`),
  completely separate from Supabase auth. Credentials are verified
  server-side only, and the session is an HMAC-signed httpOnly cookie
  (24-hour expiry) — never checked or exposed client-side. Once verified,
  the layout uses the service-role client for cross-client data, which is
  never sent to the browser.
- Stripe Embedded Checkout handles all card entry — no card data ever touches
  this app's server.
