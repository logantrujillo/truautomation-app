import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleOAuthClient } from '@/lib/google';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  let clientId: string;
  let from: 'signup' | 'dashboard';
  try {
    const parsed = JSON.parse(stateRaw);
    clientId = parsed.clientId;
    from = parsed.from === 'dashboard' ? 'dashboard' : 'signup';
  } catch {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  // Defense in depth: the state param round-trips through Google
  // untouched, but we still verify it matches the currently logged-in
  // session before writing any tokens, so a forged/replayed state value
  // can never attach tokens to someone else's client row.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== clientId) {
    return NextResponse.redirect(new URL('/login', appUrl));
  }

  const oauth2Client = getGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  const db = createAdminClient();
  await db.from('google_tokens').upsert({
    client_id: clientId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  const redirectPath = from === 'dashboard' ? '/dashboard/settings?google=connected' : '/signup?step=7&google=connected';
  return NextResponse.redirect(new URL(redirectPath, appUrl));
}
