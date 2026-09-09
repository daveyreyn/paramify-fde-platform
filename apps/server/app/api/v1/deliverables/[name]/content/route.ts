import { getPrisma } from '@paramify/db';
import { getStorage } from '@paramify/storage';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import { canAccess, findDeliverable } from '@/lib/deliverables';

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const deliverable = await findDeliverable(name);
  if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

  // Default to the current version; ?version=N serves a preserved older one.
  let { storageKey, fileName } = deliverable;
  const raw = new URL(request.url).searchParams.get('version');
  if (raw !== null) {
    const version = Number(raw);
    if (!Number.isInteger(version) || version < 1) return apiError(400, 'invalid version');
    if (version !== deliverable.version) {
      const row = await getPrisma().deliverableVersion.findUnique({
        where: { deliverableId_version: { deliverableId: deliverable.id, version } },
      });
      if (!row) return apiError(404, `no version ${version}`);
      ({ storageKey, fileName } = row);
    }
  }

  const data = await getStorage().get(storageKey);
  await getPrisma().deliverable.update({
    where: { id: deliverable.id },
    data: { installCount: { increment: 1 } },
  });

  // fileName is validated at upload (no path separators, no leading dot).
  // .slice() re-bases onto a plain ArrayBuffer to satisfy BodyInit.
  return new NextResponse(data.slice(), {
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="${fileName}"`,
      'content-length': String(data.byteLength),
    },
  });
}
