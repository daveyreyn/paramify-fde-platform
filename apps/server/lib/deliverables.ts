import { getPrisma, type Prisma, type Team } from '@paramify/db';
import type { Deliverable } from '@paramify/shared';

import { HttpError } from '@/lib/api';
import type { CurrentUser } from '@/lib/current-user';

export const deliverableInclude = { author: true, teams: true } satisfies Prisma.DeliverableInclude;

export type DeliverableRow = Prisma.DeliverableGetPayload<{ include: typeof deliverableInclude }>;

export function findDeliverable(name: string): Promise<DeliverableRow | null> {
  return getPrisma().deliverable.findUnique({ where: { name }, include: deliverableInclude });
}

export function canAccess(user: CurrentUser, deliverable: DeliverableRow): boolean {
  if (deliverable.isPublic) return true;
  if (user.isSuper || deliverable.authorId === user.id) return true;
  const teamIds = new Set(user.teams.map((team) => team.id));
  return deliverable.teams.some((team) => teamIds.has(team.id));
}

// Resolve team names → records, enforcing the sharing rule: non-supers may
// only attach teams they belong to.
export async function resolveTeams(user: CurrentUser, names: string[]): Promise<Team[]> {
  if (!names.length) return [];
  const teams = await getPrisma().team.findMany({ where: { name: { in: names } } });
  const found = new Set(teams.map((team) => team.name));
  const missing = names.filter((name) => !found.has(name));
  if (missing.length) throw new HttpError(400, `unknown team(s): ${missing.join(', ')}`);
  if (!user.isSuper) {
    const mine = new Set(user.teams.map((team) => team.id));
    const foreign = teams.filter((team) => !mine.has(team.id));
    if (foreign.length) {
      throw new HttpError(
        403,
        `sharing with teams you are not a member of requires a super user: ${foreign
          .map((team) => team.name)
          .join(', ')}`,
      );
    }
  }
  return teams;
}

export function toApiDeliverable(row: DeliverableRow): Deliverable {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    description: row.description,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    fileName: row.fileName,
    size: row.size,
    sha256: row.sha256,
    language: row.language,
    version: row.version,
    installCount: row.installCount,
    isPublic: row.isPublic,
    author: {
      id: row.author.id,
      email: row.author.email,
      name: row.author.name,
      isSuper: row.author.isSuper,
    },
    teams: row.teams.map((team) => ({ id: team.id, name: team.name })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
