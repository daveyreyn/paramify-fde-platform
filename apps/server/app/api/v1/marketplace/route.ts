import { getPrisma } from '@paramify/db';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

import { deliverableInclude, toApiDeliverable } from '@/lib/deliverables';

// The marketplace requires identity, but any user can browse it.
export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const rows = await getPrisma().deliverable.findMany({
    where: { isPublic: true },
    include: deliverableInclude,
    orderBy: [{ installCount: 'desc' }, { updatedAt: 'desc' }],
  });
  return NextResponse.json({ deliverables: rows.map(toApiDeliverable) });
}
