import { getPrisma, type Team, type User } from '@paramify/db';
import { TeamMemberRequestSchema } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError } from '@/lib/api';
import { parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return updateMembership(request, params, 'connect');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return updateMembership(request, params, 'disconnect');
}

async function updateMembership(
  request: Request,
  params: Promise<{ name: string }>,
  action: 'connect' | 'disconnect',
): Promise<NextResponse> {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');
    if (!user.isSuper) return apiError(403, 'managing teams requires a super user');

    const team: Team | null = await getPrisma().team.findUnique({ where: { name } });
    if (!team) throw new HttpError(404, `no such team: ${name}`);

    const body = await parseJsonBody(request, TeamMemberRequestSchema);
    const member: User | null = await getPrisma().user.findUnique({
      where: { email: body.email },
    });
    if (!member) throw new HttpError(404, `no such user: ${body.email}`);

    await getPrisma().team.update({
      where: { id: team.id },
      data: { users: { [action]: { id: member.id } } },
    });
    return NextResponse.json({ ok: true });
  });
}
