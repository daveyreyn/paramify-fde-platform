import { getPrisma } from '@paramify/db';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

export async function PATCH(request: Request, { params }: { params: Promise<{ email: string }> }) {
  return handleApi(async () => {
    const { email } = await params;
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');
    if (!user.isSuper) return apiError(403, 'managing users requires a super user');

    const target = await getPrisma().user.findUnique({ where: { email } });
    if (!target) throw new HttpError(404, `no such user: ${email}`);

    let body: { name?: string | null; isSuper?: boolean };
    try {
      body = await request.json();
    } catch {
      throw new HttpError(400, 'invalid JSON body');
    }

    const updated = await getPrisma().user.update({
      where: { id: target.id },
      data: {
        ...(body.name !== undefined && { name: body.name || null }),
        ...(body.isSuper !== undefined && { isSuper: Boolean(body.isSuper) }),
      },
    });
    return NextResponse.json({
      user: { id: updated.id, email: updated.email, name: updated.name, isSuper: updated.isSuper },
    });
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');
  if (!user.isSuper) return apiError(403, 'managing users requires a super user');

  const target = await getPrisma().user.findUnique({ where: { email } });
  if (!target) return apiError(404, `no such user: ${email}`);
  if (target.id === user.id) return apiError(400, 'you cannot delete yourself');

  // Deliverables keep an authorId; deleting the author would orphan them.
  const owned = await getPrisma().deliverable.count({ where: { authorId: target.id } });
  if (owned > 0) {
    return apiError(400, `${email} still owns ${owned} deliverable(s); delete those first`);
  }

  // Tokens cascade; team memberships are detached automatically.
  await getPrisma().user.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
