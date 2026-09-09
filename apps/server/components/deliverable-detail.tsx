'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  CalendarPlus,
  Check,
  Copy,
  Download,
  DownloadCloud,
  GitBranch,
  MoreHorizontal,
  Pencil,
  Terminal,
  UserRound,
} from 'lucide-react';
import type { Deliverable } from '@paramify/shared';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SaveToTeam } from '@/components/save-to-team';
import { displayName, extensionFor, languageMeta } from '@/lib/deliverable-ui';
import { ParamifyPanel } from '@/components/paramify-panel';

export type DeliverableView = 'fde' | 'customer' | 'marketplace';

type Team = { id: string; name: string };

// Copy-able CLI install line for the marketplace detail view — the platform is
// CLI-first, so the install command is a primary affordance, not an afterthought.
function InstallCommand({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  const command = `fde install ${name}`;

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-surface-code">
      <div className="flex items-center justify-between border-b border-border/70 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Terminal className="size-3.5" /> Install with the FDE CLI
        </div>
        <Button variant="ghost" size="sm" onClick={copy} className="h-7 gap-1.5 text-xs">
          {copied ? (
            <Check className="size-3.5 text-status-active" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <div className="px-4 py-3 font-mono text-[13px]">
        <span className="select-none text-muted-foreground/50">$ </span>
        <span className="text-foreground/90">{command}</span>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card p-4">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1.5 truncate text-sm text-foreground">{children}</div>
    </div>
  );
}

function CodeBlock({
  filename,
  language,
  code,
}: {
  filename: string;
  language: string | null;
  code: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code?.split('\n') ?? [];

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-surface-code">
      <div className="flex items-center justify-between border-b border-border/70 bg-card/60 px-4 py-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Terminal className="size-3.5" />
          {filename}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {languageMeta(language).label}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copy}
            disabled={!code}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-status-active" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {code !== null ? (
        <div className="max-h-[480px] overflow-auto">
          <pre className="py-4 text-[13px] leading-relaxed">
            <code className="font-mono">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[3rem_1fr]">
                  <span className="select-none px-3 text-right text-muted-foreground/40">
                    {i + 1}
                  </span>
                  <span className="whitespace-pre pr-4 text-foreground/90">{line || ' '}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Source preview unavailable — use Download to fetch the file.
        </div>
      )}
    </div>
  );
}

export function DeliverableDetail({
  deliverable,
  code,
  canManage,
  isMarketplace = false,
  viewerTeams = [],
  paramify,
}: {
  deliverable: Deliverable;
  code: string | null;
  canManage: boolean;
  isMarketplace?: boolean;
  // The viewer's own teams — drives the marketplace "Save to a team" action.
  viewerTeams?: Team[];
  // Shown to viewers who may manage the deliverable's Paramify links (team
  // members and supers); enabled=false renders a configuration hint instead.
  paramify?: { enabled: boolean };
}) {
  const backHref = isMarketplace ? '/marketplace' : '/deliverables';
  const backLabel = isMarketplace ? 'Marketplace' : 'Deliverables';
  const contentHref = `/api/v1/deliverables/${deliverable.name}/content`;
  const filename = `${deliverable.name}.${extensionFor(deliverable.language)}`;

  // Which of the viewer's teams already have this deliverable saved.
  const deliverableTeamIds = new Set(deliverable.teams.map((t) => t.id));
  const savedTeamIds = viewerTeams.filter((t) => deliverableTeamIds.has(t.id)).map((t) => t.id);

  // Only the current version is stored today (re-upload replaces the file and
  // bumps `version`); the picker is ready for real history when the backend keeps it.
  const versions = [
    {
      version: String(deliverable.version),
      publishedAt: deliverable.updatedAt.slice(0, 10),
      publishedBy: displayName(deliverable.author),
    },
  ];
  const [selected, setSelected] = useState(versions[0].version);
  const selectedVersion = versions.find((v) => v.version === selected) ?? versions[0];

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>

      {/* Header */}
      <header className="mt-5">
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
            deliverable.isPublic
              ? 'border-status-active/30 bg-status-active/10 text-status-active'
              : 'border-border bg-muted text-muted-foreground',
          )}
        >
          {deliverable.isPublic ? 'Public' : 'Private'}
        </span>

        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-mono text-2xl font-semibold tracking-tight text-foreground">
              {deliverable.name}
            </h1>
            {deliverable.title && deliverable.title !== deliverable.name && (
              <p className="mt-1 text-sm font-medium text-foreground/80">{deliverable.title}</p>
            )}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {deliverable.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isMarketplace && (
              <SaveToTeam name={deliverable.name} teams={viewerTeams} savedTeamIds={savedTeamIds} />
            )}
            <Button asChild variant={isMarketplace ? 'outline' : 'default'} className="gap-2">
              <a href={contentHref}>
                <Download className="size-4" /> Download
              </a>
            </Button>
            {canManage && (
              <>
                <Button variant="outline" className="gap-2">
                  <Pencil className="size-4" /> Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="More actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      {deliverable.isPublic ? 'Unpublish' : 'Publish'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Archive</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {deliverable.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {/* Meta strip */}
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-4">
        <Fact icon={UserRound} label="Author">
          {displayName(deliverable.author)}
        </Fact>
        <Fact icon={GitBranch} label="Version">
          v{deliverable.version}
        </Fact>
        <Fact icon={DownloadCloud} label="Installs">
          {deliverable.installCount}
        </Fact>
        <Fact icon={CalendarPlus} label="Created">
          {deliverable.createdAt.slice(0, 10)}
        </Fact>
      </div>

      {/* Install command — marketplace's primary path is the CLI */}
      {isMarketplace && <InstallCommand name={deliverable.name} />}

      {/* Body */}
      {canManage ? (
        <Tabs defaultValue="source" className="mt-8">
          <TabsList>
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="versions">Versions · {versions.length}</TabsTrigger>
            <TabsTrigger value="access">Access · {deliverable.teams.length}</TabsTrigger>
          </TabsList>

          <TabsContent value="source" className="mt-6">
            <CodeBlock filename={filename} language={deliverable.language} code={code} />
          </TabsContent>

          <TabsContent value="versions" className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="w-fit font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={v.version} className="font-mono text-sm">
                      v{v.version} (current)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {selectedVersion.publishedAt} · {selectedVersion.publishedBy}
              </span>
              <span className="flex-1" />
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                <a href={contentHref}>
                  <Download className="size-3" /> Download
                </a>
              </Button>
            </div>
            <CodeBlock filename={filename} language={deliverable.language} code={code} />
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <div className="overflow-hidden rounded-xl border border-border/70">
              {deliverable.teams.length > 0 ? (
                deliverable.teams.map((team, i) => (
                  <div
                    key={team.id}
                    className={cn(
                      'flex items-center gap-3 bg-card/40 px-4 py-3',
                      i !== 0 && 'border-t border-border/60',
                    )}
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                      <Building2 className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {team.name}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">team</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {deliverable.isPublic
                    ? 'Public — available to everyone in the marketplace.'
                    : 'Not shared with any teams yet.'}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-8">
          <CodeBlock filename={filename} language={deliverable.language} code={code} />
        </div>
      )}

      {paramify && (
        <ParamifyPanel
          name={deliverable.name}
          teams={deliverable.teams.map((team) => team.name)}
          enabled={paramify.enabled}
        />
      )}
    </div>
  );
}
