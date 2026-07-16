import 'server-only';
import { cache } from 'react';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import type { Client } from './types';

// Fetches the logged-in client's own row (RLS-scoped, safe for
// dashboard pages). Returns null if not logged in or no row exists yet.
//
// Wrapped in React's cache() so calling this multiple times during the
// same request (dashboard/layout.tsx and dashboard/page.tsx each call it)
// only hits Supabase once instead of twice. Our Supabase clients force
// `cache: 'no-store'` on every fetch (see lib/supabase/server.ts) to
// prevent cross-client data leakage, which also disables Next's
// automatic fetch deduplication — so without this, every duplicate call
// was a real extra network round trip on every dashboard page load.
export const getCurrentClient = cache(async (): Promise<Client | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('clients').select('*').eq('id', user.id).single();
  return (data as Client) ?? null;
});

// Service-role client for admin dashboard cross-client reads/writes.
// Admin *authentication* is handled separately by lib/adminAuth.ts
// (hardcoded credentials, not Supabase auth) — this just provides the
// data-access client once a session has already been verified.
export function adminDb() {
  return createAdminClient();
}
