import { getPrisma } from '@paramify/db';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

export async function DELETE(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');
  if (!user.isSuper) return apiError(403, 'managing users requires a super user');

  const orphans = await getPrisma().user.findMany({
    where: { teams: { none: {} } },
    include: { _count: { select: { deliverables: true } } },
  });

  type OrphanRow = { id: string; _count: { deliverables: number } };
  const deletable = (orphans as OrphanRow[]).filter(
    (u) => u.id !== user.id && u._count.deliverables === 0,
  );

  if (deletable.length > 0) {
    await getPrisma().user.deleteMany({
      where: { id: { in: deletable.map((u) => u.id) } },
    });
  }

  return NextResponse.json({ deleted: deletable.length });
}
