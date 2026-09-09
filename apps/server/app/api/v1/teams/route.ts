import { getPrisma } from '@paramify/db';
import { CreateTeamRequestSchema, type TeamsResponse } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError, parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const response: TeamsResponse = {
    teams: user.teams.map((team) => ({ id: team.id, name: team.name })),
  };
  return NextResponse.json(response);
}

// Create a team. Super users only.
export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');
    if (!user.isSuper) return apiError(403, 'managing teams requires a super user');

    const body = await parseJsonBody(request, CreateTeamRequestSchema);

    const existing = await getPrisma().team.findUnique({ where: { name: body.name } });
    if (existing) throw new HttpError(409, `team '${body.name}' already exists`);

    const team = await getPrisma().team.create({ data: { name: body.name } });
    return NextResponse.json({ team: { id: team.id, name: team.name } }, { status: 201 });
  });
}
