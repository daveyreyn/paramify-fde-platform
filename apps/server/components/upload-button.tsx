'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommands } from '@/hooks/use-commands';

// FDE-only entry point to the (global) upload dialog owned by CommandsProvider.
export function UploadButton() {
  const { openUpload } = useCommands();
  return (
    <Button size="lg" className="gap-2 font-medium" onClick={openUpload}>
      <Plus className="size-4" /> Upload deliverable
    </Button>
  );
}
