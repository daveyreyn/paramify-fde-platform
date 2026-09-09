import Link from 'next/link';
import { ArrowLeft, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundCard({
  title,
  message,
  backHref,
  backLabel,
}: {
  title: string;
  message: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
      <FileWarning className="size-8 text-muted-foreground/50" />
      <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={backHref}>
          <ArrowLeft className="size-4" /> {backLabel}
        </Link>
      </Button>
    </div>
  );
}
