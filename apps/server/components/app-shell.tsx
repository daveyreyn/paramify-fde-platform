'use client';

import { type ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronsUpDown,
  FileCode2,
  LogOut,
  Moon,
  Search,
  Settings,
  Store,
  Sun,
  Users,
} from 'lucide-react';
import type { User } from '@paramify/shared';

import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useCommands } from '@/hooks/use-commands';
import { displayName, initials } from '@/lib/deliverable-ui';
import { logout } from '@/app/login/actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function roleLabel(isSuper: boolean): string {
  return isSuper ? 'Forward Deployed Engineer' : 'Customer';
}

const NAV = [
  { label: 'Deliverables', icon: FileCode2, to: '/deliverables', enabled: true },
  { label: 'Marketplace', icon: Store, to: '/marketplace', enabled: true },
  { label: 'Teams', icon: Building2, to: '/teams', enabled: true },
  { label: 'Users', icon: Users, to: '/users', enabled: true },
  { label: 'Settings', icon: Settings, to: '/settings', enabled: true },
] as const;

function Brand() {
  return (
    <Link href="/deliverables" className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary font-mono text-sm font-bold text-primary-foreground shadow-[0_0_22px_-4px_color-mix(in_oklab,var(--primary)_65%,transparent)]">
        {'>_'}
      </div>
      <div className="leading-none">
        <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
          paramify
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          FDE Platform
        </div>
      </div>
    </Link>
  );
}

function UserMenu({ user, align = 'end' }: { user: User; align?: 'start' | 'end' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <Avatar className="size-8">
          <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
            {initials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium text-foreground">{displayName(user)}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">{displayName(user)}</div>
          <div className="text-xs text-muted-foreground">{roleLabel(user.isSuper)}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="size-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => void logout()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  // next-themes resolvedTheme is undefined on the server; defer the icon until
  // after mount to avoid a sun/moon hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted
          ? theme === 'dark'
            ? 'Switch to light mode'
            : 'Switch to dark mode'
          : 'Toggle theme'
      }
      className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card/60 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
    >
      {mounted && (theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />)}
    </button>
  );
}

function TenantSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <span className="flex size-6 items-center justify-center rounded bg-secondary text-secondary-foreground">
          <Building2 className="size-3.5" />
        </span>
        <span className="flex flex-col items-start leading-none">
          <span className="text-sm font-medium text-foreground">Acme Corp</span>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            fedramp · moderate
          </span>
        </span>
        <ChevronsUpDown className="ml-1 size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        <DropdownMenuItem>
          <Building2 className="size-4" /> Acme Corp
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Building2 className="size-4" /> Northwind Federal
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Building2 className="size-4" /> Globex Systems
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children, user }: { children: ReactNode; user: User }) {
  const pathname = usePathname();
  const { openPalette } = useCommands();

  return (
    <div className="min-h-svh">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/70 bg-card/40 backdrop-blur-sm lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Workspace
          </p>
          {NAV.map((item) => {
            const active = item.enabled && pathname.startsWith(item.to);
            const Icon = item.icon;
            const inner = (
              <>
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {active && (
                  <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </>
            );
            const base =
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';
            return (
              <Link
                key={item.label}
                href={item.to}
                className={cn(
                  base,
                  active
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )}
              >
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3">
          <UserMenu user={user} align="start" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-svh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/70 px-4 backdrop-blur-md sm:px-6">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block">
            <TenantSwitcher />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card/60 py-1.5 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 sm:flex"
            >
              <Search className="size-3.5" />
              <span>Search…</span>
              <kbd className="ml-4 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <ThemeToggle />
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="focus-visible:outline-none">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/deliverables">
                      <FileCode2 className="size-4" /> Deliverables
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace">
                      <Store className="size-4" /> Marketplace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => void logout()}>
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
