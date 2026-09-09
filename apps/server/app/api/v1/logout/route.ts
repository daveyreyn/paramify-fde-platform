import { getPrisma } from '@paramify/db';
import { hashToken } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';

// Revoke the presented Bearer token (CLI logout). Idempotent: revoking an
// already-deleted token still succeeds. Web sessions log out via the
// `logout` server action instead.
export async function POST(request: Request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return apiError(401, 'unauthorized');

  await getPrisma().apiToken.deleteMany({
    where: { tokenHash: hashToken(header.slice('Bearer '.length)) },
  });
  return NextResponse.json({ ok: true });
}
