import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role Supabase client. Bypasses RLS entirely — never import this
// into any file that runs in the browser, and never expose
// SUPABASE_SERVICE_ROLE_KEY via NEXT_PUBLIC_*.
//
// Legitimate uses: signup provisioning, Stripe/VAPI webhooks, admin
// dashboard cross-client reads, Google token storage.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // See lib/supabase/server.ts — bypass Next.js's fetch Data Cache so
      // cross-client admin reads are never served stale/cached responses.
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}
