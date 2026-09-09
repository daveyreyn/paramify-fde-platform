'use client';

import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useCommands } from '@/hooks/use-commands';

// Search is driven by the ⌘K palette (which sets ?q=). This toolbar opens the
// palette and reflects/clears the active filter — it isn't a text input itself.
export function DeliverablesToolbar({
  query,
  count,
  total,
}: {
  query: string;
  count: number;
  total: number;
}) {
  const router = useRouter();
  const { openPalette } = useCommands();

  return (
    <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-card/40 pl-3 pr-2 text-sm transition-colors hover:bg-accent/40 lg:max-w-sm">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <button
          type="button"
          onClick={openPalette}
          className="flex flex-1 items-center gap-2 py-2 text-left font-mono"
        >
          {query ? (
            <>
              <span className="text-muted-foreground">filter:</span>
              <span className="truncate text-foreground">{query}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Search deliverables, tags…</span>
          )}
        </button>
        {query ? (
          <button
            type="button"
            onClick={() => router.replace('/deliverables')}
            aria-label="Clear filter"
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        )}
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span className="text-foreground">{count}</span>
        <span>/ {total} deliverables</span>
      </div>
    </div>
  );
}
