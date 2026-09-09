import { getPrisma } from '@paramify/db';
import { getStorage } from '@paramify/storage';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import { canAccess, findDeliverable, toApiDeliverable } from '@/lib/deliverables';
import { paramifyClientForTeam } from '@/lib/paramify';

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const deliverable = await findDeliverable(name);
  // 404 (not 403) for inaccessible deliverables so names don't leak.
  if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

  return NextResponse.json({ deliverable: toApiDeliverable(deliverable) });
}

// Delete a deliverable and its entire version history.
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const deliverable = await findDeliverable(name);
  if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');
  if (deliverable.authorId !== user.id && !user.isSuper) {
    return apiError(403, 'only the author or a super user can delete a deliverable');
  }

  const versions = await getPrisma().deliverableVersion.findMany({
    where: { deliverableId: deliverable.id },
    select: { storageKey: true },
  });
  const paramifyLinks = await getPrisma().paramifyLink.findMany({
    where: { deliverableId: deliverable.id },
    include: { team: true },
  });
  await getPrisma().deliverable.delete({ where: { id: deliverable.id } });

  // Best-effort blob cleanup; the rows (cascade-deleted) are the source of truth.
  const keys = new Set([deliverable.storageKey, ...versions.map((v) => v.storageKey)]);
  await Promise.all(
    [...keys].map((key) =>
      getStorage()
        .delete(key)
        .catch(() => {}),
    ),
  );

  // Best-effort too: a linked validator shouldn't outlive its deliverable.
  await Promise.all(
    paramifyLinks.map((link) =>
      Promise.resolve()
        .then(() => paramifyClientForTeam(link.team).deleteValidator(link.validatorId))
        .catch(() => {}),
    ),
  );

  return NextResponse.json({ ok: true });
}
