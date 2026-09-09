import { getPrisma } from '@paramify/db';
import type { VersionsResponse } from '@paramify/shared';
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

  const rows = await getPrisma().deliverableVersion.findMany({
    where: { deliverableId: deliverable.id },
    orderBy: { version: 'desc' },
  });
  const response: VersionsResponse = {
    versions: rows.map((row) => ({
      version: row.version,
      fileName: row.fileName,
      size: row.size,
      sha256: row.sha256,
      language: row.language,
      createdAt: row.createdAt.toISOString(),
    })),
  };
  return NextResponse.json(response);
}
