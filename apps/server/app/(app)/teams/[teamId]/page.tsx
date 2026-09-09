import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { getPrisma } from '@paramify/db';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotFoundCard } from '@/components/not-found-card';
import { TeamParamifyKey } from '@/components/team-paramify-key';
import { displayName, initials } from '@/lib/deliverable-ui';
import { currentViewer } from '@/lib/viewer';

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const viewer = await currentViewer();
  const team = await getPrisma().team.findUnique({
    where: { id: teamId },
    include: { users: true },
  });

  if (!team) {
    return (
      <NotFoundCard
        title="Team not found"
        message="This workspace doesn’t exist or has been removed."
        backHref="/teams"
        backLabel="Back to teams"
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Teams
      </Link>

      <header className="mt-5 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <Building2 className="size-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{team.name}</h1>
      </header>

      <h2 className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Members · {team.users.length}
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
        {team.users.map((member, i) => (
          <Link
            key={member.id}
            href={`/users/${member.id}`}
            className={cn(
              'flex items-center gap-3 bg-card/40 px-4 py-3 transition-colors hover:bg-accent/50',
              i !== 0 && 'border-t border-border/60',
            )}
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(member)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {displayName(member)}
              </div>
              <div className="truncate font-mono text-xs text-muted-foreground">{member.email}</div>
            </div>
            {member.isSuper && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                super
              </span>
            )}
          </Link>
        ))}
      </div>

      {viewer?.isSuper && (
        <TeamParamifyKey team={team.name} configured={team.paramifyApiKey !== null} />
      )}
    </div>
  );
}
