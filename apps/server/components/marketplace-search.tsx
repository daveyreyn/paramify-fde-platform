'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// The marketplace is its own discovery surface, so it gets a plain search input
// (driving ?q= on /marketplace) rather than the registry's ⌘K palette.
export function MarketplaceSearch({ query }: { query: string }) {
  const router = useRouter();

  const update = (value: string) => {
    const v = value.trim();
    router.replace(v ? `/marketplace?q=${encodeURIComponent(v)}` : '/marketplace', {
      scroll: false,
    });
  };

  return (
    <div className="relative w-full lg:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        defaultValue={query}
        onChange={(e) => update(e.target.value)}
        placeholder="Search the marketplace…"
        className="bg-card/40 pl-9 font-mono text-sm"
      />
    </div>
  );
}
