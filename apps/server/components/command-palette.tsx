'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Download,
  FileCode2,
  LogOut,
  Moon,
  Search,
  Settings,
  Store,
  Sun,
  Terminal,
  UploadCloud,
  UserRound,
  Users,
} from 'lucide-react';
import type { Deliverable } from '@paramify/shared';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { LanguageChip } from '@/components/language-chip';
import { displayName } from '@/lib/deliverable-ui';
import { logout } from '@/app/login/actions';
import { useTheme } from '@/hooks/use-theme';

// How many of each entity to surface before the user starts typing.
const RECENT_COUNT = 5;

export type TeamLite = { id: string; name: string };
export type UserLite = { id: string; name: string | null; email: string };

export function CommandPalette({
  open,
  onOpenChange,
  onUpload,
  deliverables,
  teams,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: () => void;
  // Fetched server-side in the (app) layout and passed down.
  deliverables: Deliverable[];
  teams: TeamLite[];
  users: UserLite[];
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  // When set, the palette shows the per-deliverable actions page.
  const [activeItem, setActiveItem] = useState<Deliverable | null>(null);

  const q = query.trim();

  const reset = () => {
    setQuery('');
    setActiveItem(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  // Run an action, then close the palette.
  const act = (fn: () => void) => {
    fn();
    handleOpenChange(false);
  };
  const goto = (path: string) => act(() => router.push(path));

  const navigation = [
    {
      id: 'nav-deliverables',
      label: 'Go to Deliverables',
      icon: FileCode2,
      keywords: ['registry', 'home'],
      run: () => goto('/deliverables'),
    },
    {
      id: 'nav-marketplace',
      label: 'Go to Marketplace',
      icon: Store,
      keywords: ['browse', 'discover', 'public'],
      run: () => goto('/marketplace'),
    },
    {
      id: 'nav-teams',
      label: 'Go to Teams',
      icon: Building2,
      keywords: ['workspaces'],
      run: () => goto('/teams'),
    },
    {
      id: 'nav-users',
      label: 'Go to Users',
      icon: Users,
      keywords: ['directory', 'people'],
      run: () => goto('/users'),
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: Settings,
      keywords: ['profile', 'preferences', 'api key'],
      run: () => goto('/settings'),
    },
  ];

  const actions = [
    {
      id: 'act-upload',
      label: 'Upload deliverable',
      icon: UploadCloud,
      keywords: ['new', 'add', 'create'],
      run: () => act(onUpload),
    },
    {
      id: 'act-theme',
      label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
      icon: theme === 'dark' ? Sun : Moon,
      keywords: ['theme', 'dark', 'light', 'appearance'],
      run: () => act(toggleTheme),
    },
    {
      id: 'act-signout',
      label: 'Sign out',
      icon: LogOut,
      keywords: ['logout', 'log out'],
      run: () => act(() => void logout()),
    },
  ];

  const shownDeliverables = q ? deliverables : deliverables.slice(0, RECENT_COUNT);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Command palette"
      description="Search deliverables, teams, and users, or run a command"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={
          activeItem ? `${activeItem.name} — pick an action…` : 'Search or run a command…'
        }
        onKeyDown={(e) => {
          // Backspace on an empty query backs out of the item actions page.
          if (e.key === 'Backspace' && query === '' && activeItem) {
            e.preventDefault();
            setActiveItem(null);
          }
        }}
      />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>

        {activeItem ? (
          /* ── Per-deliverable actions page ── */
          <CommandGroup heading={`Actions · ${activeItem.name}`}>
            <CommandItem
              value="open"
              keywords={['view', 'detail']}
              onSelect={() => goto(`/deliverables/${activeItem.name}`)}
            >
              <FileCode2 />
              <span>Open deliverable</span>
            </CommandItem>
            <CommandItem
              value="download"
              keywords={['file', 'get']}
              onSelect={() =>
                act(() => {
                  window.location.href = `/api/v1/deliverables/${activeItem.name}/content`;
                })
              }
            >
              <Download />
              <span>Download file</span>
            </CommandItem>
            <CommandItem
              value="copy-install"
              keywords={['cli', 'fde', 'clipboard']}
              onSelect={() =>
                act(() => void navigator.clipboard.writeText(`fde install ${activeItem.name}`))
              }
            >
              <Terminal />
              <span>
                Copy <span className="font-mono">fde install {activeItem.name}</span>
              </span>
            </CommandItem>
            <CommandSeparator />
            <CommandItem value="back" onSelect={() => setActiveItem(null)}>
              <ArrowLeft />
              <span>Back</span>
            </CommandItem>
          </CommandGroup>
        ) : (
          /* ── Root page ── */
          <>
            {q && (
              <CommandGroup heading="Search">
                <CommandItem
                  value={q}
                  onSelect={() => goto(`/deliverables?q=${encodeURIComponent(q)}`)}
                >
                  <Search />
                  <span>
                    Filter deliverables for <span className="font-mono text-foreground">“{q}”</span>
                  </span>
                  <ArrowRight className="ml-auto" />
                </CommandItem>
              </CommandGroup>
            )}

            {shownDeliverables.length > 0 && (
              <CommandGroup heading={q ? 'Deliverables' : 'Recent deliverables'}>
                {shownDeliverables.map((d) => (
                  <CommandItem
                    key={d.id}
                    value={`deliverable:${d.name}`}
                    keywords={[d.name, d.title, ...d.tags, displayName(d.author)]}
                    onSelect={() => {
                      setQuery('');
                      setActiveItem(d);
                    }}
                  >
                    <LanguageChip language={d.language} />
                    <span className="truncate font-mono">{d.name}</span>
                    <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {q && teams.length > 0 && (
              <CommandGroup heading="Teams">
                {teams.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={`team:${t.name}`}
                    keywords={[t.name]}
                    onSelect={() => goto(`/teams/${t.id}`)}
                  >
                    <Building2 />
                    <span className="truncate">{t.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {q && users.length > 0 && (
              <CommandGroup heading="Users">
                {users.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={`user:${u.email}`}
                    keywords={[u.email, displayName(u)]}
                    onSelect={() => goto(`/users/${u.id}`)}
                  >
                    <UserRound />
                    <span className="truncate">{displayName(u)}</span>
                    <span className="ml-auto shrink-0 truncate pl-3 font-mono text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              {navigation.map((c) => {
                const Icon = c.icon;
                return (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    keywords={[c.label, ...c.keywords]}
                    onSelect={c.run}
                  >
                    <Icon />
                    <span>{c.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandGroup heading="Actions">
              {actions.map((c) => {
                const Icon = c.icon;
                return (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    keywords={[c.label, ...c.keywords]}
                    onSelect={c.run}
                  >
                    <Icon />
                    <span>{c.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
