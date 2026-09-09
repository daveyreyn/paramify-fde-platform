import { getPrisma } from '@paramify/db';
import { getStorage } from '@paramify/storage';
import type { Deliverable } from '@paramify/shared';

import type { CurrentUser } from '@/lib/current-user';
import { deliverableInclude, toApiDeliverable } from '@/lib/deliverables';

// Decode a deliverable's stored file as text for the source preview. Returns
// null on any failure (missing blob, binary, etc.) so the UI can fall back.
export async function readDeliverableContent(storageKey: string): Promise<string | null> {
  try {
    return new TextDecoder().decode(await getStorage().get(storageKey));
  } catch {
    return null;
  }
}

// Deliverables the viewer is allowed to see in the authenticated registry:
// supers see everything; everyone else sees public ones, ones they authored,
// and ones shared with a team they belong to.
export async function listVisibleDeliverables(user: CurrentUser): Promise<Deliverable[]> {
  const teamIds = user.teams.map((team) => team.id);
  const rows = await getPrisma().deliverable.findMany({
    where: user.isSuper
      ? undefined
      : {
          OR: [
            { isPublic: true },
            { authorId: user.id },
            { teams: { some: { id: { in: teamIds } } } },
          ],
        },
    include: deliverableInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(toApiDeliverable);
}

// Public marketplace listing — any logged-in user can browse these.
export async function listMarketplaceDeliverables(): Promise<Deliverable[]> {
  const rows = await getPrisma().deliverable.findMany({
    where: { isPublic: true },
    include: deliverableInclude,
    orderBy: { installCount: 'desc' },
  });
  return rows.map(toApiDeliverable);
}
