import { getPrisma, type User } from '@paramify/db';
import {
  generateToken,
  hashToken,
  verifyPassword,
  type User as PublicUser,
} from '@paramify/shared';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'fde_session';

// The response shape for a user: everything sensitive (hashes) stays out.
export function publicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, isSuper: user.isSuper };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
} as const;

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

// Web sessions are backed by a minted token so the cookie and Bearer paths
// share one lookup; logout deletes the row.
export async function createSessionToken(userId: string): Promise<string> {
  const token = generateToken();
  await getPrisma().apiToken.create({
    data: { tokenHash: hashToken(token), label: 'web', userId },
  });
  return token;
}

export async function deleteSessionToken(token: string | undefined): Promise<void> {
  if (!token) return;
  await getPrisma().apiToken.deleteMany({ where: { tokenHash: hashToken(token), label: 'web' } });
}

export async function userFromToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const apiToken = await getPrisma().apiToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  return apiToken?.user ?? null;
}

// Route handlers: Bearer header (CLI) first, session cookie (browser) as fallback.
export async function authenticate(request: Request): Promise<User | null> {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return userFromToken(header.slice('Bearer '.length));
  return sessionUser();
}

// Server components and actions.
export async function sessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  return userFromToken(cookieStore.get(SESSION_COOKIE)?.value);
}

// Post-login redirects stay on this site: a path only, no protocol-relative URLs.
export function safeNextPath(raw: string | undefined): string | null {
  if (raw?.startsWith('/') && !raw.startsWith('//')) return raw;
  return null;
}

// The CLI login callback may only point at the requester's own machine.
export function loopbackUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const loopbackHosts = ['127.0.0.1', 'localhost', '[::1]'];
  if (url.protocol !== 'http:' || !loopbackHosts.includes(url.hostname)) return null;
  return url;
}
