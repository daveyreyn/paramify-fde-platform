import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clock, LayoutGrid, Store, TrendingUp, X } from 'lucide-react';
import type { Deliverable } from '@paramify/shared';

import { DeliverableCard } from '@/components/deliverable-card';
import { MarketplaceSearch } from '@/components/marketplace-search';
import { searchDeliverables } from '@/lib/deliverable-ui';
import { listMarketplaceDeliverables } from '@/lib/deliverable-views';
import { currentViewer } from '@/lib/viewer';

// Below this many published deliverables, curated rails add noise rather than
// signal — fall back to a single grid.
const SECTION_THRESHOLD = 4;
const RAIL_SIZE = 3;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q = '', tag = '' } = await searchParams;
  const [all, viewer] = await Promise.all([listMarketplaceDeliverables(), currentViewer()]);

  const scoped = tag ? all.filter((d) => d.tags.includes(tag)) : all;
  const results = searchDeliverables(q, scoped);
  const isFiltered = Boolean(q || tag);

  // A deliverable is "saved" when it already lives in one of the viewer's teams.
  const myTeamIds = new Set(viewer?.teams.map((t) => t.id) ?? []);
  const isSaved = (d: Deliverable) => d.teams.some((t) => myTeamIds.has(t.id));

  const card = (d: Deliverable) => (
    <DeliverableCard key={d.id} deliverable={d} basePath="/marketplace" saved={isSaved(d)} />
  );

  // Clearing the active tag keeps any text query in place.
  const clearTagHref = q ? `/marketplace?q=${encodeURIComponent(q)}` : '/marketplace';

  // Curated rails for the unfiltered landing: most-installed first (the list
  // already arrives sorted by installs), then the most recently updated ones not
  // already featured. The full grid below is the complete catalog.
  const popular = all.slice(0, RAIL_SIZE);
  const popularIds = new Set(popular.map((d) => d.id));
  const recent = [...all]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .filter((d) => !popularIds.has(d.id))
    .slice(0, RAIL_SIZE);
  const sectioned = !isFiltered && all.length >= SECTION_THRESHOLD;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
          // marketplace
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Marketplace</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Browse automation published by FDE teams across Paramify. Open a deliverable to preview it
          and install it into your workspace.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <MarketplaceSearch query={q} />
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="text-foreground">{results.length}</span>
          <span>/ {all.length} published</span>
        </div>
      </div>

      {/* Active tag filter */}
      {tag && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filtered by</span>
          <Link
            href={clearTagHref}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-primary transition-colors hover:bg-primary/20"
          >
            #{tag}
            <X className="size-3" />
          </Link>
        </div>
      )}

      {results.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Store className="size-6 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {all.length === 0 ? 'Nothing published yet' : 'Nothing in the marketplace matches'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.length === 0
              ? 'Published deliverables show up here.'
              : tag && q
                ? `No published deliverables tagged #${tag} match “${q}”.`
                : tag
                  ? `No published deliverables are tagged #${tag}.`
                  : `Try a different search term.`}
          </p>
          {isFiltered && all.length > 0 && (
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : sectioned ? (
        <div className="mt-8 space-y-10">
          <Section
            icon={<TrendingUp className="size-3.5" />}
            label="Popular"
            count={popular.length}
          >
            {popular.map(card)}
          </Section>
          {recent.length > 0 && (
            <Section
              icon={<Clock className="size-3.5" />}
              label="Recently updated"
              count={recent.length}
            >
              {recent.map(card)}
            </Section>
          )}
          <Section
            icon={<LayoutGrid className="size-3.5" />}
            label="All deliverables"
            count={all.length}
          >
            {all.map(card)}
          </Section>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{results.map(card)}</div>
      )}
    </div>
  );
}

function Section({
  icon,
  label,
  count,
  children,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
        <span className="text-muted-foreground/50">· {count}</span>
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
