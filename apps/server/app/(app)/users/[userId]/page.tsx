import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPrisma } from '@paramify/db';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DeliverableCard } from '@/components/deliverable-card';
import { NotFoundCard } from '@/components/not-found-card';
import { deliverableInclude, toApiDeliverable } from '@/lib/deliverables';
import { displayName, initials } from '@/lib/deliverable-ui';

export default async function UserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    include: { teams: true },
  });

  if (!user) {
    return (
      <NotFoundCard
        title="User not found"
        message="This user doesn’t exist or no longer has platform access."
        backHref="/users"
        backLabel="Back to users"
      />
    );
  }

  const rows = await getPrisma().deliverable.findMany({
    where: { authorId: user.id },
    include: deliverableInclude,
    orderBy: { updatedAt: 'desc' },
  });
  const owned = rows.map(toApiDeliverable);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Users
      </Link>

      <header className="mt-5 flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {displayName(user)}
            </h1>
            {user.isSuper && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                super
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{user.email}</p>
        </div>
      </header>

      {user.teams.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {user.teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
            >
              {team.name}
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Owns · {owned.length}
      </h2>
      {owned.length > 0 ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {owned.map((d) => (
            <DeliverableCard key={d.id} deliverable={d} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Owns no deliverables.</p>
      )}
    </div>
  );
}
