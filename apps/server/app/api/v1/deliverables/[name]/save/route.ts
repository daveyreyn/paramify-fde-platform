import { getPrisma } from '@paramify/db';
import { SaveDeliverableRequestSchema } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { HttpError, handleApi, parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import {
  canAccess,
  deliverableInclude,
  findDeliverable,
  toApiDeliverable,
  type DeliverableRow,
} from '@/lib/deliverables';

// Shared preamble for save/unsave: both attach and detach a marketplace
// deliverable to/from one of the caller's own teams, so they enforce the same
// rule — membership of the target team (supers may target any team).
async function resolveTarget(
  request: Request,
  params: Promise<{ name: string }>,
): Promise<{ deliverable: DeliverableRow; teamId: string; teamName: string }> {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) throw new HttpError(401, 'unauthorized');

  const deliverable = await findDeliverable(name);
  if (!deliverable || !canAccess(user, deliverable)) throw new HttpError(404, 'not found');
  if (!deliverable.isPublic) {
    throw new HttpError(400, 'only marketplace (public) deliverables can be saved to a team');
  }

  const body = await parseJsonBody(request, SaveDeliverableRequestSchema);
  const team = await getPrisma().team.findUnique({ where: { name: body.team } });
  if (!team) throw new HttpError(400, `unknown team: ${body.team}`);
  if (!user.isSuper && !user.teams.some((t) => t.id === team.id)) {
    throw new HttpError(403, `not a member of team '${team.name}'`);
  }

  return { deliverable, teamId: team.id, teamName: team.name };
}

// Save a marketplace deliverable to one of your teams so it shows up in the
// team view. Requires membership of the target team, not super.
export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { deliverable, teamId } = await resolveTarget(request, params);
    const alreadySaved = deliverable.teams.some((t) => t.id === teamId);
    const row = alreadySaved
      ? deliverable
      : await getPrisma().deliverable.update({
          where: { id: deliverable.id },
          data: { teams: { connect: { id: teamId } } },
          include: deliverableInclude,
        });
    return NextResponse.json({ deliverable: toApiDeliverable(row) });
  });
}

// Remove a previously-saved marketplace deliverable from one of your teams —
// the inverse of save, same membership rule. Idempotent when not saved.
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { deliverable, teamId } = await resolveTarget(request, params);
    const isSaved = deliverable.teams.some((t) => t.id === teamId);
    const row = !isSaved
      ? deliverable
      : await getPrisma().deliverable.update({
          where: { id: deliverable.id },
          data: { teams: { disconnect: { id: teamId } } },
          include: deliverableInclude,
        });
    return NextResponse.json({ deliverable: toApiDeliverable(row) });
  });
}
