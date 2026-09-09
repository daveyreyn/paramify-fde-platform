'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Deliverable } from '@paramify/shared';

import { CommandPalette, type TeamLite, type UserLite } from '@/components/command-palette';
import { UploadDeliverableDialog } from '@/components/upload-deliverable-dialog';

type CommandsContextValue = {
  openPalette: () => void;
  openUpload: () => void;
};

const CommandsContext = createContext<CommandsContextValue | null>(null);

/**
 * Owns the app's global, cross-page UI: the ⌘K command palette and the upload
 * dialog. Any screen can trigger them via useCommands() without prop-drilling.
 */
export function CommandsProvider({
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const value: CommandsContextValue = {
    openPalette: () => setPaletteOpen(true),
    openUpload: () => setUploadOpen(true),
  };

  return (
    <CommandsContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onUpload={() => setUploadOpen(true)}
        deliverables={deliverables}
        teams={teams}
        users={users}
      />
      <UploadDeliverableDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </CommandsContext.Provider>
  );
}

export function useCommands() {
  const ctx = useContext(CommandsContext);
  if (!ctx) throw new Error('useCommands must be used within a CommandsProvider');
  return ctx;
}
