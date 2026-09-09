import Link from 'next/link';
import { ArrowUpRight, Check, DownloadCloud } from 'lucide-react';
import type { Deliverable } from '@paramify/shared';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { displayName, initials, languageMeta } from '@/lib/deliverable-ui';

function shortName(full: string) {
  const [first, last] = full.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}

export function DeliverableCard({
  deliverable,
  basePath = '/deliverables',
  saved = false,
}: {
  deliverable: Deliverable;
  // Marketplace links to /marketplace/:name; the registry to /deliverables/:name.
  basePath?: string;
  // Marketplace only: the deliverable already lives in one of the viewer's teams.
  saved?: boolean;
}) {
  const author = deliverable.author;
  const lang = languageMeta(deliverable.language);

  return (
    <Card
      className={cn(
        'group relative flex h-full flex-col gap-0 overflow-hidden p-0 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40',
        'hover:shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--primary)_30%,transparent)]',
      )}
    >
      {/* Card-filling link: clicking anywhere opens the deliverable. The content
          layer below is pointer-events-none so clicks fall through to here, while
          interactive bits (the tags) re-enable pointer events and sit above it —
          this keeps the whole card a link without nesting anchors. */}
      <Link
        href={`${basePath}/${deliverable.name}`}
        aria-label={deliverable.name}
        className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
      />

      {/* top hairline lights up on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent to-transparent transition-all duration-300 group-hover:via-primary/60" />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-mono text-[15px] font-medium text-foreground transition-colors group-hover:text-primary">
            {deliverable.name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {saved && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-status-active/30 bg-status-active/10 px-1.5 py-0.5 text-[10px] font-medium text-status-active"
                title="Already saved to one of your teams"
              >
                <Check className="size-3" /> Saved
              </span>
            )}
            <ArrowUpRight className="size-4 text-muted-foreground/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {deliverable.description || deliverable.title}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {deliverable.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              href={`${basePath}?tag=${encodeURIComponent(tag)}`}
              className="pointer-events-auto relative z-10 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              #{tag}
            </Link>
          ))}
          {deliverable.tags.length > 3 && (
            <span className="px-1 py-0.5 font-mono text-[11px] text-muted-foreground/50">
              +{deliverable.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mt-5 flex items-center gap-2 border-t border-border/60 px-5 py-3">
        <Avatar className="size-6">
          <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
            {initials(author)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs text-muted-foreground">
          {shortName(displayName(author))}
        </span>
        <span className="flex-1" />
        <span
          className={cn(
            'rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none',
            lang.chip,
          )}
        >
          {lang.abbr}
        </span>
        <span
          className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground"
          title={`${deliverable.installCount} install${deliverable.installCount === 1 ? '' : 's'}`}
        >
          <DownloadCloud className="size-3" />
          {deliverable.installCount}
        </span>
      </div>
    </Card>
  );
}
