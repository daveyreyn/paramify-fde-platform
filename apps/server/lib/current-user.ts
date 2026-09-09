import { getPrisma, type Prisma } from '@paramify/db';

import { authenticate } from '@/lib/auth';

export type CurrentUser = Prisma.UserGetPayload<{ include: { teams: true } }>;

// Identity plus team memberships, for routes whose access checks need teams.
// Auth itself (Bearer ApiToken or web session cookie) lives in lib/auth.
export async function getCurrentUser(request: Request): Promise<CurrentUser | null> {
  const user = await authenticate(request);
  if (!user) return null;
  return getPrisma().user.findUnique({ where: { id: user.id }, include: { teams: true } });
}
