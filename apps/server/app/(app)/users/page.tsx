import { getPrisma } from '@paramify/db';

import { UsersClient } from '@/components/users-client';

export default async function UsersPage() {
  const users = await getPrisma().user.findMany({
    orderBy: { email: 'asc' },
    select: { id: true, email: true, name: true, isSuper: true },
  });

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <UsersClient initialUsers={users} />
    </div>
  );
}
