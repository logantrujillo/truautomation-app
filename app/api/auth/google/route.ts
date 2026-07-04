import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGoogleOAuthClient, GOOGLE_SCOPES } from '@/lib/google';

// Starts the Google OAuth flow for the currently logged-in client.
// `from` tells the callback where to send the user back to afterward
// (the signup wizard vs. dashboard settings).
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') === 'dashboard' ? 'dashboard' : 'signup';

  const oauth2Client = getGoogleOAuthClient();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SCOPES,
    state: JSON.stringify({ clientId: user.id, from }),
  });

  return NextResponse.redirect(authUrl);
}
