import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getPrisma } from '@paramify/db';

import { Providers } from '@/components/providers';
import { AppShell } from '@/components/app-shell';
import { publicUser } from '@/lib/auth';
import { currentViewer } from '@/lib/viewer';
import { listVisibleDeliverables } from '@/lib/deliverable-views';

// Authenticated shell: every route in this group renders inside the sidebar +
// command palette. Unauthenticated visitors are bounced to /login.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const viewer = await currentViewer();
  if (!viewer) redirect('/login');

  // Data the ⌘K palette searches across.
  const [deliverables, teams, users] = await Promise.all([
    listVisibleDeliverables(viewer),
    getPrisma().team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    getPrisma().user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { email: 'asc' },
    }),
  ]);

  return (
    <Providers deliverables={deliverables} teams={teams} users={users}>
      <AppShell user={publicUser(viewer)}>{children}</AppShell>
    </Providers>
  );
}
