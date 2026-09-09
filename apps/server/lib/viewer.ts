import { getPrisma } from '@paramify/db';

import { sessionUser } from '@/lib/auth';
import type { CurrentUser } from '@/lib/current-user';

// The signed-in user with team memberships, for server components / pages.
// (lib/current-user.getCurrentUser is the Request-based variant for routes.)
export async function currentViewer(): Promise<CurrentUser | null> {
  const user = await sessionUser();
  if (!user) return null;
  return getPrisma().user.findUnique({ where: { id: user.id }, include: { teams: true } });
}
