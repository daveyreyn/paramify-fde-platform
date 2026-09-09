import type { MeResponse } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { authenticate, publicUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const response: MeResponse = { user: publicUser(user) };
  return NextResponse.json(response);
}
