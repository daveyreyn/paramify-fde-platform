import type { CurrentUser } from '@/lib/current-user';
import type { DeliverableRow } from '@/lib/deliverables';

// Whether the Paramify panel is shown: link/sync/remove all require membership
// in one of the deliverable's teams (supers are exempt), mirroring the
// /paramify route rules — the panel would be all dead ends for anyone else.
export function canManageParamify(viewer: CurrentUser, deliverable: DeliverableRow): boolean {
  if (viewer.isSuper) return true;
  const mine = new Set(viewer.teams.map((team) => team.id));
  return deliverable.teams.some((team) => mine.has(team.id));
}
