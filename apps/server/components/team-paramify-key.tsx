'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Super-only form to set or clear the team's Paramify API key. The key is
// write-only: the server stores it and only ever reports configured/not.
export function TeamParamifyKey({ team, configured }: { team: string; configured: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (paramifyApiKey: string | null) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/teams/${encodeURIComponent(team)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paramifyApiKey }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? response.statusText);
      }
      setDraft('');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="mt-8 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <KeyRound className="size-3" /> Paramify API key
      </h2>
      <div className="mt-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={
              configured
                ? 'rounded-full border border-status-active/30 px-2 py-0.5 text-[11px] font-medium text-status-active'
                : 'rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground'
            }
          >
            {configured ? 'configured' : 'not configured'}
          </span>
          <form
            className="flex flex-1 flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) void save(draft.trim());
            }}
          >
            <Input
              type="password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={configured ? 'Replace key…' : 'Paste a Paramify API key…'}
              autoComplete="off"
              className="h-8 max-w-xs font-mono text-xs"
            />
            <Button type="submit" size="sm" className="text-xs" disabled={busy || !draft.trim()}>
              Save
            </Button>
            {configured && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={busy}
                onClick={() => void save(null)}
              >
                Clear
              </Button>
            )}
          </form>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Bound to one Paramify workspace; this team’s validators are created there. Needs validator
          read/write permissions. Stored server-side and never shown again.
        </p>
        {error && <p className="mt-2 text-xs text-status-error">{error}</p>}
      </div>
    </>
  );
}
