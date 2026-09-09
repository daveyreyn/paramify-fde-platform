import { getPrisma } from '@paramify/db';

import { TeamsClient } from '@/components/teams-client';

export default async function TeamsPage() {
  const [teams, allUsers] = await Promise.all([
    getPrisma().team.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        users: { select: { id: true, email: true, name: true, isSuper: true } },
      },
    }),
    getPrisma().user.findMany({
      orderBy: { email: 'asc' },
      select: { id: true, email: true, name: true, isSuper: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <TeamsClient initialTeams={teams} allUsers={allUsers} />
    </div>
  );
}
