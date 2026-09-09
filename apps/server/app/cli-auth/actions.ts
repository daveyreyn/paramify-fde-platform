'use server';

import { getPrisma } from '@paramify/db';
import { generateToken, hashToken } from '@paramify/shared';
import { redirect } from 'next/navigation';

import { loopbackUrl, sessionUser } from '@/lib/auth';

export async function approve(formData: FormData): Promise<void> {
  const user = await sessionUser();
  if (!user) redirect('/login');

  const raw = formData.get('redirect');
  const target = loopbackUrl(typeof raw === 'string' ? raw : undefined);
  const state = formData.get('state');
  if (!target || typeof state !== 'string' || !state) redirect('/');

  const token = generateToken();
  await getPrisma().apiToken.create({
    data: { tokenHash: hashToken(token), label: 'cli', userId: user.id },
  });

  target.searchParams.set('token', token);
  target.searchParams.set('state', state);
  redirect(target.href);
}
