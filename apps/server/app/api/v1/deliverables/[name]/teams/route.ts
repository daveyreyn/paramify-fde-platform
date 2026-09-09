import { getPrisma } from '@paramify/db';
import { ShareDeliverableRequestSchema } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import {
  canAccess,
  deliverableInclude,
  findDeliverable,
  resolveTeams,
  toApiDeliverable,
} from '@/lib/deliverables';

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');
    if (deliverable.authorId !== user.id && !user.isSuper) {
      return apiError(403, 'only the author or a super user can share a deliverable');
    }

    const body = await parseJsonBody(request, ShareDeliverableRequestSchema);
    const teams = await resolveTeams(user, body.teams);

    const connected = new Set(deliverable.teams.map((team) => team.id));
    const row = await getPrisma().deliverable.update({
      where: { id: deliverable.id },
      data: {
        teams: { connect: teams.filter((t) => !connected.has(t.id)).map((t) => ({ id: t.id })) },
      },
      include: deliverableInclude,
    });
    return NextResponse.json({ deliverable: toApiDeliverable(row) });
  });
}

// Unshare: detach teams. Same rule as sharing — author for their own teams,
// super for any.
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');
    if (deliverable.authorId !== user.id && !user.isSuper) {
      return apiError(403, 'only the author or a super user can unshare a deliverable');
    }

    const body = await parseJsonBody(request, ShareDeliverableRequestSchema);
    const teams = await resolveTeams(user, body.teams);

    const connected = new Set(deliverable.teams.map((team) => team.id));
    const row = await getPrisma().deliverable.update({
      where: { id: deliverable.id },
      data: {
        teams: { disconnect: teams.filter((t) => connected.has(t.id)).map((t) => ({ id: t.id })) },
      },
      include: deliverableInclude,
    });
    return NextResponse.json({ deliverable: toApiDeliverable(row) });
  });
}
