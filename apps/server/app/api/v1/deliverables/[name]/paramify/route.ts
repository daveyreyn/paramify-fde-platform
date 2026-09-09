import { getPrisma, type Prisma, type Team } from '@paramify/db';
import {
  ParamifyLinkRequestSchema,
  type ParamifyLink as ApiParamifyLink,
  type ParamifyValidator,
} from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError } from '@/lib/api';
import { getCurrentUser, type CurrentUser } from '@/lib/current-user';
import { canAccess, findDeliverable, type DeliverableRow } from '@/lib/deliverables';
import { paramifyClientForTeam, validatorUrl } from '@/lib/paramify';

// Linking a deliverable to a Paramify Validator. The link is per (deliverable,
// team): the team's API key selects the Paramify workspace the validator
// lives in. All Paramify calls happen here — keys never leave the server.

const linkInclude = { team: true } satisfies Prisma.ParamifyLinkInclude;
type LinkRow = Prisma.ParamifyLinkGetPayload<{ include: typeof linkInclude }>;

// Link status with a live check against Paramify.
export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

    // Public deliverables are visible to everyone, but their links (and the
    // live checks spending team API calls) are only for members/author/super.
    const links = (await findLinks(deliverable.id)).filter((link) => canManage(user, link.team));
    return NextResponse.json({
      version: deliverable.version,
      links: await Promise.all(links.map((link) => liveLink(link, deliverable))),
    });
  });
}

// Create the deliverable as a validator in Paramify and store the link.
export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

    const team = resolveTargetTeam(user, deliverable, await teamFromBody(request));
    const existing = await getPrisma().paramifyLink.findUnique({
      where: { deliverableId_teamId: { deliverableId: deliverable.id, teamId: team.id } },
    });
    if (existing) {
      throw new HttpError(
        409,
        `already linked to a validator via team '${team.name}' (sync to update it)`,
      );
    }

    const validator = await paramifyClientForTeam(team).createValidator(
      validatorFields(deliverable),
    );
    const link = await getPrisma().paramifyLink.create({
      data: {
        deliverableId: deliverable.id,
        teamId: team.id,
        validatorId: validator.id,
        syncedVersion: deliverable.version,
      },
      include: linkInclude,
    });
    return NextResponse.json({ link: toApiLink(link, deliverable, validator) });
  });
}

// Full sync: ensure the validator exists and matches the deliverable's current
// metadata. Creates the link when missing, recreates the validator if it was
// deleted on the Paramify side, and updates name/statement otherwise.
export async function PUT(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

    const teamName = await teamFromBody(request);
    const links = await findLinks(deliverable.id);
    let targets = teamName ? links.filter((link) => link.team.name === teamName) : links;
    if (!teamName) {
      targets = targets.filter((link) => canManage(user, link.team));
    } else if (targets.length && !canManage(user, targets[0].team)) {
      throw forbiddenTeam(teamName);
    }

    if (!targets.length) {
      // Nothing linked yet (for this team): sync degrades to create.
      const team = resolveTargetTeam(user, deliverable, teamName);
      const validator = await paramifyClientForTeam(team).createValidator(
        validatorFields(deliverable),
      );
      const link = await getPrisma().paramifyLink.create({
        data: {
          deliverableId: deliverable.id,
          teamId: team.id,
          validatorId: validator.id,
          syncedVersion: deliverable.version,
        },
        include: linkInclude,
      });
      return NextResponse.json({ links: [toApiLink(link, deliverable, validator)] });
    }

    const synced = await Promise.all(targets.map((link) => syncLink(link, deliverable)));
    return NextResponse.json({ links: synced });
  });
}

// Delete the validator in Paramify and remove the link.
export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    const deliverable = await findDeliverable(name);
    if (!deliverable || !canAccess(user, deliverable)) return apiError(404, 'not found');

    const teamName = await teamFromBody(request);
    const links = await findLinks(deliverable.id);
    if (!links.length) throw new HttpError(404, `'${name}' is not linked to a Paramify validator`);

    let target: LinkRow;
    if (teamName) {
      const match = links.find((link) => link.team.name === teamName);
      if (!match) throw new HttpError(404, `'${name}' is not linked via team '${teamName}'`);
      target = match;
    } else if (links.length === 1) {
      target = links[0];
    } else {
      throw new HttpError(
        400,
        `linked via multiple teams (${links.map((l) => l.team.name).join(', ')}); pass a team`,
      );
    }
    if (!canManage(user, target.team)) throw forbiddenTeam(target.team.name);

    await paramifyClientForTeam(target.team).deleteValidator(target.validatorId);
    await getPrisma().paramifyLink.delete({ where: { id: target.id } });
    return NextResponse.json({ ok: true });
  });
}

function findLinks(deliverableId: string): Promise<LinkRow[]> {
  return getPrisma().paramifyLink.findMany({
    where: { deliverableId },
    include: linkInclude,
    orderBy: { createdAt: 'asc' },
  });
}

// Validator fields the sync owns. The name is the deliverable's slug (unique
// here, and validator names must be unique per Paramify workspace).
function validatorFields(deliverable: DeliverableRow): { name: string; statement: string } {
  return { name: deliverable.name, statement: deliverable.description || deliverable.title };
}

function canManage(user: CurrentUser, team: Pick<Team, 'id'>): boolean {
  return user.isSuper || user.teams.some((mine) => mine.id === team.id);
}

function forbiddenTeam(name: string): HttpError {
  return new HttpError(
    403,
    `managing the Paramify link via team '${name}' requires membership (or a super user)`,
  );
}

// Which team's key to use when creating a link: an explicit team must be one
// the deliverable is shared with; otherwise there must be exactly one
// candidate (shared team, member-or-super, key configured).
function resolveTargetTeam(
  user: CurrentUser,
  deliverable: DeliverableRow,
  teamName: string | undefined,
): Team {
  if (teamName) {
    const team = deliverable.teams.find((candidate) => candidate.name === teamName);
    if (!team) {
      throw new HttpError(
        400,
        `'${deliverable.name}' is not shared with team '${teamName}' (share it first)`,
      );
    }
    if (!canManage(user, team)) throw forbiddenTeam(team.name);
    return team;
  }

  const candidates = deliverable.teams.filter(
    (team) => team.paramifyApiKey && canManage(user, team),
  );
  if (candidates.length === 1) return candidates[0];
  if (!candidates.length) {
    throw new HttpError(
      400,
      'no shared team with a configured Paramify API key (a super user can set one on the team page or with `fde teams set-key`)',
    );
  }
  throw new HttpError(
    400,
    `multiple teams are eligible (${candidates.map((t) => t.name).join(', ')}); pass a team`,
  );
}

// POST/PUT/DELETE accept an optional JSON body of { team }; no body at all is
// fine too (curl convenience).
async function teamFromBody(request: Request): Promise<string | undefined> {
  const text = await request.text();
  if (!text.trim()) return undefined;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid JSON body');
  }
  try {
    return ParamifyLinkRequestSchema.parse(body).team;
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : 'invalid request body');
  }
}

async function syncLink(link: LinkRow, deliverable: DeliverableRow): Promise<ApiParamifyLink> {
  const client = paramifyClientForTeam(link.team);
  const fields = validatorFields(deliverable);
  // Recreate when the validator was deleted on the Paramify side.
  const validator =
    (await client.updateValidator(link.validatorId, fields)) ??
    (await client.createValidator(fields));
  const row = await getPrisma().paramifyLink.update({
    where: { id: link.id },
    data: { validatorId: validator.id, syncedVersion: deliverable.version },
    include: linkInclude,
  });
  return toApiLink(row, deliverable, validator);
}

async function liveLink(link: LinkRow, deliverable: DeliverableRow): Promise<ApiParamifyLink> {
  let validator: ParamifyValidator | null = null;
  let error: string | undefined;
  try {
    validator = await paramifyClientForTeam(link.team).getValidator(link.validatorId);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }
  return toApiLink(link, deliverable, validator, error);
}

function toApiLink(
  link: LinkRow,
  deliverable: DeliverableRow,
  validator: ParamifyValidator | null,
  error?: string,
): ApiParamifyLink {
  return {
    team: link.team.name,
    validatorId: link.validatorId,
    syncedVersion: link.syncedVersion,
    inSync: validator !== null && link.syncedVersion === deliverable.version,
    validator,
    url: validatorUrl(link.validatorId),
    ...(error === undefined ? {} : { error }),
  };
}
