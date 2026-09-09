import { getPrisma } from '@paramify/db';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import { deliverableInclude, findDeliverable, toApiDeliverable } from '@/lib/deliverables';

// Publish a deliverable to the public marketplace. Super users only.
export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return setPublic(request, params, true);
}

// Remove a deliverable from the marketplace (team sharing is unaffected).
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return setPublic(request, params, false);
}

async function setPublic(
  request: Request,
  params: Promise<{ name: string }>,
  isPublic: boolean,
): Promise<NextResponse> {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');
  if (!user.isSuper) {
    return apiError(403, 'changing marketplace visibility requires a super user');
  }

  const deliverable = await findDeliverable(name);
  if (!deliverable) return apiError(404, 'not found');

  const row = await getPrisma().deliverable.update({
    where: { id: deliverable.id },
    data: { isPublic },
    include: deliverableInclude,
  });
  return NextResponse.json({ deliverable: toApiDeliverable(row) });
}
