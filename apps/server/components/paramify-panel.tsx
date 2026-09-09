'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Link2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import type { ParamifyLink, ParamifyStatusResponse } from '@paramify/shared';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Status + actions for the deliverable's Paramify validator links. Talks to
// /api/v1/deliverables/[name]/paramify with the web session cookie — the same
// endpoints the CLI uses.

async function call(
  name: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  team?: string,
): Promise<ParamifyStatusResponse | null> {
  const response = await fetch(`/api/v1/deliverables/${encodeURIComponent(name)}/paramify`, {
    method,
    ...(method === 'GET'
      ? {}
      : {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ team }),
        }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? response.statusText);
  }
  return method === 'GET' ? ((await response.json()) as ParamifyStatusResponse) : null;
}

function linkState(link: ParamifyLink, version: number) {
  if (link.error) {
    return { label: 'check failed', className: 'border-status-error/30 text-status-error' };
  }
  if (!link.validator) {
    return { label: 'missing in Paramify', className: 'border-status-error/30 text-status-error' };
  }
  if (link.syncedVersion === version) {
    return { label: 'in sync', className: 'border-status-active/30 text-status-active' };
  }
  return {
    label: `out of date (v${link.syncedVersion} → v${version})`,
    className: 'border-status-draft/30 text-status-draft',
  };
}

export function ParamifyPanel({
  name,
  teams,
  enabled,
}: {
  name: string;
  // Names of the teams the deliverable is shared with (link-team choices).
  teams: string[];
  // False when the server has no PARAMIFY_URL configured.
  enabled: boolean;
}) {
  const [status, setStatus] = useState<ParamifyStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<string | undefined>(teams.length === 1 ? teams[0] : undefined);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setStatus(await call(name, 'GET'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [name]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const act = async (method: 'POST' | 'PUT' | 'DELETE', actionTeam?: string) => {
    setBusy(true);
    setError(null);
    try {
      await call(name, method, actionTeam);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <ShieldCheck className="size-3" /> Paramify validators
      </h2>

      <div className="mt-3 overflow-hidden rounded-xl border border-border/70">
        {!enabled ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Paramify sync isn’t configured — set <code className="font-mono">PARAMIFY_URL</code> on
            the server.
          </div>
        ) : status === null && error === null ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Checking Paramify…
          </div>
        ) : (
          <>
            {status?.links.map((link, i) => {
              const state = linkState(link, status.version);
              return (
                <div
                  key={`${link.team}-${link.validatorId}`}
                  className={cn(
                    'flex flex-wrap items-center gap-3 bg-card/40 px-4 py-3',
                    i !== 0 && 'border-t border-border/60',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{link.team}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[11px] font-medium',
                          state.className,
                        )}
                        title={link.error}
                      >
                        {state.label}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      validator {link.validatorId}
                    </div>
                  </div>
                  {link.url && (
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs">
                      <a href={link.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3" /> Open
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={busy}
                    onClick={() => void act('PUT', link.team)}
                  >
                    <RefreshCw className="size-3" /> Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs text-status-error"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete the validator linked via '${link.team}' from Paramify and remove the link?`,
                        )
                      ) {
                        void act('DELETE', link.team);
                      }
                    }}
                  >
                    <Trash2 className="size-3" /> Remove
                  </Button>
                </div>
              );
            })}

            {status?.links.length === 0 &&
              (teams.length === 0 ? (
                // Links are created through a shared team's API key, so there
                // is nothing to offer until the deliverable is shared.
                <div className="bg-card/40 px-4 py-3 text-sm text-muted-foreground">
                  Not linked to a Paramify validator. Validators are created through a team’s API
                  key — share this deliverable with a team first.
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3 bg-card/40 px-4 py-3">
                  <span className="flex-1 text-sm text-muted-foreground">
                    Not linked to a Paramify validator.
                  </span>
                  {teams.length > 1 && (
                    <Select value={team} onValueChange={setTeam}>
                      <SelectTrigger size="sm" className="w-40 text-xs">
                        <SelectValue placeholder="via team…" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((option) => (
                          <SelectItem key={option} value={option} className="text-xs">
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={busy || team === undefined}
                    onClick={() => void act('POST', team)}
                  >
                    <Link2 className="size-3" /> Link to Paramify
                  </Button>
                </div>
              ))}

            {error && (
              <div className="border-t border-border/60 bg-status-error/5 px-4 py-2.5 text-xs text-status-error">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
