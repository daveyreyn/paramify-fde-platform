'use client';

import { type ReactNode } from 'react';
import type { Deliverable } from '@paramify/shared';

import { TooltipProvider } from '@/components/ui/tooltip';
import { CommandsProvider } from '@/hooks/use-commands';
import type { TeamLite, UserLite } from '@/components/command-palette';

export function Providers({
  children,
  deliverables,
  teams,
  users,
}: {
  children: ReactNode;
  deliverables: Deliverable[];
  teams: TeamLite[];
  users: UserLite[];
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <CommandsProvider deliverables={deliverables} teams={teams} users={users}>
        {children}
      </CommandsProvider>
    </TooltipProvider>
  );
}
