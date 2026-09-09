import type { Deliverable } from '@paramify/shared';

// Pure presentational helpers for the real `Deliverable` shape — safe to import
// from both server components and client components (no server-only deps).

type LangMeta = { label: string; abbr: string; chip: string };

const KNOWN_LANGUAGES: Record<string, LangMeta> = {
  python: { label: 'Python', abbr: 'PY', chip: 'text-sky-300 border-sky-400/20 bg-sky-400/10' },
  typescript: {
    label: 'TypeScript',
    abbr: 'TS',
    chip: 'text-blue-300 border-blue-400/20 bg-blue-400/10',
  },
  javascript: {
    label: 'JavaScript',
    abbr: 'JS',
    chip: 'text-amber-300 border-amber-400/20 bg-amber-400/10',
  },
  bash: { label: 'Bash', abbr: 'SH', chip: 'text-teal-300 border-teal-400/20 bg-teal-400/10' },
  shell: { label: 'Shell', abbr: 'SH', chip: 'text-teal-300 border-teal-400/20 bg-teal-400/10' },
  go: { label: 'Go', abbr: 'GO', chip: 'text-cyan-300 border-cyan-400/20 bg-cyan-400/10' },
  powershell: {
    label: 'PowerShell',
    abbr: 'PS',
    chip: 'text-violet-300 border-violet-400/20 bg-violet-400/10',
  },
};

const FALLBACK_LANGUAGE: LangMeta = {
  label: 'Text',
  abbr: 'TXT',
  chip: 'text-muted-foreground border-border bg-muted',
};

const EXTENSIONS: Record<string, string> = {
  python: 'py',
  typescript: 'ts',
  javascript: 'js',
  bash: 'sh',
  shell: 'sh',
  go: 'go',
  powershell: 'ps1',
};

export function languageMeta(language: string | null | undefined): LangMeta {
  if (!language) return FALLBACK_LANGUAGE;
  const known = KNOWN_LANGUAGES[language.toLowerCase()];
  if (known) return known;
  return { ...FALLBACK_LANGUAGE, label: language, abbr: language.slice(0, 2).toUpperCase() };
}

export function extensionFor(language: string | null | undefined): string {
  return (language && EXTENSIONS[language.toLowerCase()]) || 'txt';
}

// Single matcher shared by the deliverables page (?q=) and the command palette.
export function searchDeliverables(query: string, list: Deliverable[]): Deliverable[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

export function displayName(user: { name: string | null; email: string }): string {
  return user.name ?? user.email;
}

export function initials(user: { name: string | null; email: string }): string {
  const base = user.name ?? user.email;
  const parts = base.split(/[\s.@]+/).filter(Boolean);
  const derived = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (derived || base.slice(0, 2)).toUpperCase();
}
