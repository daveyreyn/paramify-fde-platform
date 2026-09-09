'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCode2, Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function UploadDeliverableDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setDescription('');
    setFile(null);
    setTags([]);
    setTagDraft('');
    setError(null);
  };

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, '').toLowerCase();
    if (tag && !tags.includes(tag)) setTags([...tags, tag]);
    setTagDraft('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || pending) return;
    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('metadata', JSON.stringify({ name: name.trim(), description, tags }));
      const res = await fetch('/api/v1/deliverables', { method: 'POST', body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Upload failed (${res.status})`);
      }
      // Reflect the new deliverable in the server-rendered list.
      router.refresh();
      onOpenChange(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload deliverable</DialogTitle>
          <DialogDescription>
            Add a new automation deliverable to the registry. You can edit its details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* File picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            {file ? (
              <>
                <FileCode2 className="size-6 text-primary" />
                <span className="font-mono text-sm text-foreground">{file.name}</span>
                <span className="text-xs text-muted-foreground">Click to choose another file</span>
              </>
            ) : (
              <>
                <UploadCloud className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Choose a file</span>
                <span className="text-xs text-muted-foreground">.py, .ts, .sh, .go, .ps1</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.ts,.sh,.go,.ps1"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              // Suggest a name matching the server's kebab-case slug rule.
              if (f && !name) {
                setName(
                  f.name
                    .replace(/\.[^.]+$/, '')
                    .toLowerCase()
                    .replace(/[^a-z0-9-]+/g, '-')
                    .replace(/^-+|-+$/g, ''),
                );
              }
            }}
          />

          <div className="grid gap-1.5">
            <label htmlFor="deliverable-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="deliverable-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-automation-deliverable"
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="deliverable-description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="deliverable-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this deliverable do?"
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="deliverable-tags" className="text-sm font-medium text-foreground">
              Tags
            </label>
            <Input
              id="deliverable-tags"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
                  setTags(tags.slice(0, -1));
                }
              }}
              onBlur={addTag}
              placeholder="Type a tag and press Enter"
              className="font-mono text-sm"
            />
            {tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      aria-label={`Remove tag ${tag}`}
                      className="transition-colors hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim() || !file}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
