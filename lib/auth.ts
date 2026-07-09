import 'server-only';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import type { Client } from './types';

// Fetches the logged-in client's own row (RLS-scoped, safe for
// dashboard pages). Returns null if not logged in or no row exists yet.
export async function getCurrentClient(): Promise<Client | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('clients').select('*').eq('id', user.id).single();
  return (data as Client) ?? null;
}

// Service-role client for admin dashboard cross-client reads/writes.
// Admin *authentication* is handled separately by lib/adminAuth.ts
// (hardcoded credentials, not Supabase auth) — this just provides the
// data-access client once a session has already been verified.
export function adminDb() {
  return createAdminClient();
}
