import { getPrisma } from '@paramify/db';
import {
  CreateUserRequestSchema,
  generatePassword,
  hashPassword,
  type UsersResponse,
} from '@paramify/shared';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError, parseJsonBody } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';

// User management is super-only, both reads and writes.

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');
  if (!user.isSuper) return apiError(403, 'managing users requires a super user');

  const rows = await getPrisma().user.findMany({
    include: { teams: true },
    orderBy: { email: 'asc' },
  });
  const response: UsersResponse = {
    users: rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      isSuper: row.isSuper,
      teams: row.teams.map((team) => ({ id: team.id, name: team.name })),
    })),
  };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');
    if (!user.isSuper) return apiError(403, 'managing users requires a super user');

    const body = await parseJsonBody(request, CreateUserRequestSchema);

    const existing = await getPrisma().user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, `user '${body.email}' already exists`);

    // Same convention as the seed: only the hash is stored, so the password
    // in this response is the only time it is ever visible.
    const password = generatePassword();
    const row = await getPrisma().user.create({
      data: {
        email: body.email,
        name: body.name,
        isSuper: body.isSuper,
        passwordHash: await hashPassword(password),
      },
    });

    return NextResponse.json(
      {
        user: { id: row.id, email: row.email, name: row.name, isSuper: row.isSuper },
        initialPassword: password,
      },
      { status: 201 },
    );
  });
}
