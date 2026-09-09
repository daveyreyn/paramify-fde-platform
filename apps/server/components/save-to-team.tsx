'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, FolderPlus, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Team = { id: string; name: string };

// Marketplace primary action: copy a public deliverable into one of the viewer's
// teams, or remove it again. Shape adapts to team count — single button vs.
// picker — and each team toggles between saved and not.
export function SaveToTeam({
  name,
  teams,
  savedTeamIds,
}: {
  name: string;
  teams: Team[];
  savedTeamIds: string[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => new Set(savedTeamIds));
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Nothing to save into — the viewer belongs to no teams.
  if (teams.length === 0) return null;

  // Add or remove the deliverable from a team. POST saves, DELETE unsaves —
  // both hit /save and share the membership rule, so the UI is a plain toggle.
  async function toggle(team: Team) {
    if (pending) return;
    const removing = saved.has(team.id);
    setPending(team.id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/deliverables/${encodeURIComponent(name)}/save`, {
        method: removing ? 'DELETE' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ team: team.name }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `${removing ? 'Remove' : 'Save'} failed (${res.status})`);
      }
      setSaved((prev) => {
        const next = new Set(prev);
        if (removing) next.delete(team.id);
        else next.add(team.id);
        return next;
      });
      // Reflect the membership change in the server-rendered Access tab / team views.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setPending(null);
    }
  }

  // Single team: one decisive button that toggles. When saved it reads "Saved
  // to <team>" and flips to a destructive "Remove from <team>" on hover.
  if (teams.length === 1) {
    const team = teams[0];
    const isSaved = saved.has(team.id);
    const busy = pending !== null;
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          onClick={() => toggle(team)}
          disabled={busy}
          variant={isSaved ? 'outline' : 'default'}
          className="group gap-2"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSaved ? (
            <>
              <span className="inline-flex items-center gap-2 group-hover:hidden">
                <Check className="size-4 text-status-active" /> Saved to {team.name}
              </span>
              <span className="hidden items-center gap-2 text-destructive group-hover:inline-flex">
                <X className="size-4" /> Remove from {team.name}
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-2">
              <FolderPlus className="size-4" /> Save to {team.name}
            </span>
          )}
        </Button>
        {error && <span className="max-w-56 text-right text-xs text-destructive">{error}</span>}
      </div>
    );
  }

  // Multiple teams: a picker where each row toggles. Saved rows show a check
  // that becomes a destructive ✕ on hover to signal "click to remove".
  const savedCount = teams.filter((t) => saved.has(t.id)).length;
  const allSaved = savedCount === teams.length;
  return (
    <div className="flex flex-col items-end gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={allSaved ? 'outline' : 'default'} className="gap-2">
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : allSaved ? (
              <Check className="size-4 text-status-active" />
            ) : (
              <FolderPlus className="size-4" />
            )}
            {allSaved ? 'Saved' : savedCount > 0 ? `Saved · ${savedCount}` : 'Save to a team'}
            <ChevronDown className="size-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {teams.map((team) => {
            const isSaved = saved.has(team.id);
            return (
              <DropdownMenuItem
                key={team.id}
                disabled={pending !== null}
                onSelect={(e) => {
                  e.preventDefault();
                  void toggle(team);
                }}
                aria-label={isSaved ? `Remove from ${team.name}` : `Save to ${team.name}`}
                className="group/item justify-between gap-3"
              >
                <span className="truncate">{team.name}</span>
                {pending === team.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isSaved ? (
                  <>
                    <Check className="size-4 text-status-active group-hover/item:hidden" />
                    <X className="hidden size-4 text-destructive group-hover/item:block" />
                  </>
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span className="max-w-56 text-right text-xs text-destructive">{error}</span>}
    </div>
  );
}
