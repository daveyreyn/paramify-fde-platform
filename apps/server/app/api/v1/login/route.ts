import { LoginRequestSchema, type MeResponse } from '@paramify/shared';
import { NextResponse } from 'next/server';

import {
  createSessionToken,
  publicUser,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyCredentials,
} from '@/lib/auth';

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = LoginRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const body: MeResponse = { user: publicUser(user) };
  const response = NextResponse.json(body);
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
