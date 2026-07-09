import { NextResponse } from 'next/server';
import { verifyCredentials, setAdminSessionCookie } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = body?.username;
  const password = body?.password;

  if (typeof username !== 'string' || typeof password !== 'string' || !verifyCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ success: true });
}
