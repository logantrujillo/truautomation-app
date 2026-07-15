import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminDb } from '@/lib/auth';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const db = adminDb();
  const { data } = await db.from('google_tokens').select('client_id').eq('client_id', user.id).maybeSingle();

  return NextResponse.json({ connected: !!data });
}
