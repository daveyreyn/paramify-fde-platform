import { cn } from '@/lib/utils';
import { languageMeta } from '@/lib/deliverable-ui';

export function LanguageChip({
  language,
  withLabel = false,
  className,
}: {
  language: string | null;
  withLabel?: boolean;
  className?: string;
}) {
  const meta = languageMeta(language);
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-md border px-1.5 font-mono text-[11px] font-semibold tracking-wider',
        meta.chip,
        className,
      )}
    >
      {meta.abbr}
      {withLabel && <span className="font-sans font-medium tracking-normal">{meta.label}</span>}
    </span>
  );
}
