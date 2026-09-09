import { getPrisma } from '@paramify/db';
import { SetTeamParamifyKeyRequestSchema } from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

// Set or clear the team's Paramify API key. Super users only; the key is
// write-only and never appears in any response.
export async function PATCH(request: Request, { params }: { params: Promise<{ name: string }> }) {
  return handleApi(async () => {
    const { name } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');
    if (!user.isSuper) return apiError(403, 'managing teams requires a super user');

    const team = await getPrisma().team.findUnique({ where: { name } });
    if (!team) return apiError(404, `no such team: ${name}`);

    const { paramifyApiKey } = await parseJsonBody(request, SetTeamParamifyKeyRequestSchema);
    await getPrisma().team.update({ where: { id: team.id }, data: { paramifyApiKey } });
    return NextResponse.json({ team: { id: team.id, name: team.name } });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');
  if (!user.isSuper) return apiError(403, 'managing teams requires a super user');

  const team = await getPrisma().team.findUnique({ where: { name } });
  if (!team) return apiError(404, `no such team: ${name}`);

  // Memberships and deliverable shares are m-n join rows and detach
  // automatically; the deliverables themselves are untouched.
  await getPrisma().team.delete({ where: { id: team.id } });
  return NextResponse.json({ ok: true });
}
