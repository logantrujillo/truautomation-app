-- =========================================================================
-- TruAutomation client account system — Supabase schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Safe to run top-to-bottom on a fresh project.
-- =========================================================================

-- ---------------------------------------------------------------------
-- CLIENTS
-- One row per business account. id == auth.users.id (created at signup
-- Step 1, so the password is hashed by Supabase Auth immediately and
-- never touches our own storage). `status` gates dashboard/Twilio access.
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  business_name text,
  contact_name text,
  phone text,
  industry text, -- 'plumbing' | 'hvac' | 'electrical' | 'dental' | 'other' — also determines
                 -- which AI receptionist brand the client sees (see lib/brand.ts): 'dental' -> Nova, everything else -> Alex
  address text,
  plan text check (plan in ('after_hours', '247')),
  status text not null default 'pending_onboarding'
    check (status in ('pending_onboarding', 'pending_payment', 'active', 'suspended')),

  -- AI receptionist configuration (column kept as alex_instructions for both
  -- brands — additive change, not renamed, to avoid a real data migration)
  alex_instructions text,
  business_hours jsonb,

  -- Assigned by admin, not the client
  twilio_number text,
  vapi_agent_id text,

  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_setup_item_id text,
  stripe_metered_item_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SERVICES — services this client offers, configured during signup /
-- editable later in Settings. Read/write by the owning client.
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- FAQS — question/answer pairs the AI receptionist (Alex or Nova) uses when answering calls.
-- Read/write by the owning client.
-- ---------------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CALLS — populated exclusively by the VAPI webhook (service role).
-- Clients can read their own; no client-side writes.
-- ---------------------------------------------------------------------
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  vapi_call_id text unique,
  twilio_number text,
  caller_number text,
  caller_name text,
  started_at timestamptz,
  duration_seconds integer default 0,
  outcome text check (outcome in ('booked', 'cancelled', 'escalated', 'inquiry')),
  summary text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- APPOINTMENTS — created by the VAPI webhook (and/or Google Calendar
-- sync) when a call results in a booking. Clients can read their own.
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  call_id uuid references public.calls(id) on delete set null,
  customer_name text,
  customer_phone text,
  scheduled_at timestamptz,
  service text,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  google_event_id text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GOOGLE_TOKENS — OAuth refresh/access tokens for Calendar.
-- No RLS policies at all: only the service-role key (server-only) may
-- ever read or write this table.
-- ---------------------------------------------------------------------
create table if not exists public.google_tokens (
  client_id uuid primary key references public.clients(id) on delete cascade,
  access_token text,
  refresh_token text,
  expiry timestamptz,
  calendar_id text,
  sheet_id text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- TWILIO_NUMBERS — pool of numbers Logan has purchased in Twilio,
-- mirrored here so the admin dashboard can assign one per client.
-- ---------------------------------------------------------------------
create table if not exists public.twilio_numbers (
  phone_number text primary key,
  friendly_name text,
  assigned_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ADMINS — allowlist of user IDs (Logan) permitted to view /admin.
-- Add Logan's auth user id after he signs up once through Supabase Auth:
--   insert into public.admins (user_id, email) values ('<uuid>', 'info@truautomationtechnologies.com');
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.faqs enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;
alter table public.google_tokens enable row level security;
alter table public.twilio_numbers enable row level security;
alter table public.admins enable row level security;

-- CLIENTS: a client can see, create, and update only their own row.
-- The row is created client-side (RLS-scoped) immediately after
-- supabase.auth.signUp() succeeds in Step 1 of the signup wizard, so
-- auth.uid() already matches the id being inserted.
create policy "clients_select_own" on public.clients
  for select using (auth.uid() = id);

create policy "clients_insert_own" on public.clients
  for insert with check (auth.uid() = id);

create policy "clients_update_own" on public.clients
  for update using (auth.uid() = id);

-- SERVICES: owning client has full read/write.
create policy "services_select_own" on public.services
  for select using (auth.uid() = client_id);
create policy "services_insert_own" on public.services
  for insert with check (auth.uid() = client_id);
create policy "services_update_own" on public.services
  for update using (auth.uid() = client_id);
create policy "services_delete_own" on public.services
  for delete using (auth.uid() = client_id);

-- FAQS: owning client has full read/write.
create policy "faqs_select_own" on public.faqs
  for select using (auth.uid() = client_id);
create policy "faqs_insert_own" on public.faqs
  for insert with check (auth.uid() = client_id);
create policy "faqs_update_own" on public.faqs
  for update using (auth.uid() = client_id);
create policy "faqs_delete_own" on public.faqs
  for delete using (auth.uid() = client_id);

-- CALLS: owning client can read only. Writes come exclusively from the
-- VAPI webhook using the service-role key (bypasses RLS).
create policy "calls_select_own" on public.calls
  for select using (auth.uid() = client_id);

-- APPOINTMENTS: owning client can read only.
create policy "appointments_select_own" on public.appointments
  for select using (auth.uid() = client_id);

-- GOOGLE_TOKENS: intentionally no policies — RLS enabled with zero
-- grants means anon/authenticated roles get nothing; only the
-- service-role key (used server-side only) can read/write.

-- TWILIO_NUMBERS: not client-facing at all; admin dashboard reads/writes
-- this via the service-role key. No policies granted here either.

-- ADMINS: a signed-in user may check whether *they* are an admin, but
-- cannot see the rest of the allowlist.
create policy "admins_select_self" on public.admins
  for select using (auth.uid() = user_id);

-- =========================================================================
-- Keep updated_at fresh on clients
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- =========================================================================
-- MIGRATION: vapi_agent_id (admin dashboard, VAPI agent assignment)
-- Run this manually in the Supabase SQL Editor on existing projects —
-- it's already included in the CREATE TABLE above for fresh installs.
-- =========================================================================
alter table public.clients add column if not exists vapi_agent_id text;

-- =========================================================================
-- MIGRATION: manual monthly stats + call transcripts
-- Until there are enough clients to justify wiring the dashboard straight
-- to VAPI/Twilio usage data, Logan enters these numbers by hand each day
-- via the admin dashboard. Run this manually in the Supabase SQL Editor.
-- =========================================================================
alter table public.clients add column if not exists manual_minutes_used numeric not null default 0;
alter table public.clients add column if not exists manual_appointments_booked integer not null default 0;
alter table public.clients add column if not exists manual_calls_handled integer not null default 0;

-- Lets the admin paste a call transcript against a caller's number without
-- a VAPI call record backing it.
alter table public.calls add column if not exists transcript text;
