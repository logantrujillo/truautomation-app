import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

// Hardcoded admin credentials — intentionally separate from Supabase auth.
// Never import this file into anything that runs in the browser.
const ADMIN_USERNAME = 'logantrujillo';
const ADMIN_PASSWORD = 'Logan206!';

const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SECRET = process.env.ADMIN_SESSION_SECRET || 'truautomation-admin-session-secret-v1';

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyCredentials(username: string, password: string): boolean {
  return safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

function buildSessionValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const sig = sign(`${ADMIN_USERNAME}.${expiresAt}`);
  return `${expiresAt}.${sig}`;
}

export async function setAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, buildSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAdminSessionValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return false;

  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) return false;
  const expiresAtStr = raw.slice(0, dotIndex);
  const sig = raw.slice(dotIndex + 1);

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSig = sign(`${ADMIN_USERNAME}.${expiresAtStr}`);
  return safeEqual(sig, expectedSig);
}
