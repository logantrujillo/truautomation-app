import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client bound to the current request's cookies.
// Runs as the logged-in user (anon key + their session) — RLS applies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Next.js 14 caches fetch() by default, and its cache key does not
      // account for the Authorization header — so without this, one
      // user's cached auth/data response could be served to a different
      // user hitting the same Supabase URL. Force every Supabase request
      // to bypass that cache entirely.
      global: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) => fetch(url, { ...options, cache: 'no-store' }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no writable cookie store
            // (e.g. during a page render) — middleware refreshes sessions
            // instead, so this is safe to ignore.
          }
        },
      },
    }
  );
}
