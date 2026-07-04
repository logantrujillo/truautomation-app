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

// Checks admin allowlist membership for the current session. Uses the
// user's own RLS-scoped client for the identity check (a user can only
// ever see their own admins row), then the caller should switch to the
// admin (service-role) client for any cross-client data fetch.
export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('admins').select('user_id, email').eq('user_id', user.id).single();
  if (!data) return null;

  return { userId: data.user_id, email: data.email };
}

export function adminDb() {
  return createAdminClient();
}
