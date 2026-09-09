import { getPrisma } from '@paramify/db';
import { getStorage } from '@paramify/storage';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import { canAccess, findDeliverable } from '@/lib/deliverables';

// Delete one preserved version. The current version can only be removed by
// deleting the whole deliverable (or uploading a newer version first).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string; version: string }> },
) {
  const { name, version: rawVersion } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const deliverable = await findDeliverable(name);
  if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');
  if (deliverable.authorId !== user.id && !user.isSuper) {
    return apiError(403, 'only the author or a super user can delete a version');
  }

  const version = Number(rawVersion);
  if (!Number.isInteger(version) || version < 1) return apiError(400, 'invalid version');
  if (version === deliverable.version) {
    return apiError(400, 'cannot delete the current version; delete the deliverable instead');
  }

  const row = await getPrisma().deliverableVersion.findUnique({
    where: { deliverableId_version: { deliverableId: deliverable.id, version } },
  });
  if (!row) return apiError(404, `no version ${version}`);

  await getPrisma().deliverableVersion.delete({ where: { id: row.id } });
  await getStorage()
    .delete(row.storageKey)
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
