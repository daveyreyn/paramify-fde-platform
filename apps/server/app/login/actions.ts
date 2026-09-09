'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  createSessionToken,
  deleteSessionToken,
  safeNextPath,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyCredentials,
} from '@/lib/auth';

export async function login(formData: FormData): Promise<void> {
  const rawNext = formData.get('next');
  const next = safeNextPath(typeof rawNext === 'string' ? rawNext : undefined);

  const email = formData.get('email');
  const password = formData.get('password');
  const user =
    typeof email === 'string' && typeof password === 'string'
      ? await verifyCredentials(email.trim(), password)
      : null;
  if (!user) redirect(`/login?error=1${next ? `&next=${encodeURIComponent(next)}` : ''}`);

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect(next ?? '/');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  await deleteSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  cookieStore.delete(SESSION_COOKIE);
  redirect('/');
}
