import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DeliverableCard } from '@/components/deliverable-card';
import { DeliverablesToolbar } from '@/components/deliverables-toolbar';
import { UploadButton } from '@/components/upload-button';
import { searchDeliverables } from '@/lib/deliverable-ui';
import { currentViewer } from '@/lib/viewer';
import { listVisibleDeliverables } from '@/lib/deliverable-views';

export default async function DeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q = '', tag = '' } = await searchParams;
  const viewer = await currentViewer();
  if (!viewer) redirect('/login');

  // Supers see everything; everyone else sees what they're permitted.
  const all = await listVisibleDeliverables(viewer);
  const scoped = tag ? all.filter((d) => d.tags.includes(tag)) : all;
  const results = searchDeliverables(q, scoped);

  // Clearing the active tag keeps any text query in place.
  const clearTagHref = q ? `/deliverables?q=${encodeURIComponent(q)}` : '/deliverables';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary dark:text-white">
            // deliverable registry
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Deliverables
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Upload, manage, and run automation across your FedRAMP engagements. Open a deliverable
            to inspect its source, sharing, and metadata.
          </p>
        </div>
        {viewer.isSuper && <UploadButton />}
      </div>

      <DeliverablesToolbar query={q} count={results.length} total={all.length} />

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

      {/* Grid */}
      {results.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((d) => (
            <DeliverableCard key={d.id} deliverable={d} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Search className="size-6 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {all.length === 0
              ? 'No deliverables yet'
              : tag && !q
                ? `No deliverables tagged #${tag}`
                : 'No deliverables match'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.length === 0
              ? 'Upload one with the FDE CLI or the button above.'
              : 'Try a different search term.'}
          </p>
          {all.length > 0 && (q || tag) && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/deliverables">Clear filters</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
