import type { Deliverable, ParamifyLink } from '@paramify/shared';

import type { VaultManifest } from './vault.js';

export function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 'B';
  for (const next of ['KB', 'MB', 'GB']) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return unit === 'B' ? `${value} B` : `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

// Vault state attached to list/marketplace rows in --json output (the same
// information the LOCAL column renders for humans).
export interface LocalState {
  version: number;
  sha256: string;
  upToDate: boolean;
}

export type DeliverableWithLocal = Deliverable & { local: LocalState | null };

export function withLocal(deliverable: Deliverable, vault: VaultManifest): DeliverableWithLocal {
  const entry = vault[deliverable.name];
  const local = entry
    ? {
        version: entry.version,
        sha256: entry.sha256,
        upToDate: entry.sha256 === deliverable.sha256,
      }
    : null;
  return { ...deliverable, local };
}

// Columns shared by the header and rows; [label, width, alignRight?].
const COLUMNS: Array<[string, number, boolean?]> = [
  ['NAME', 30],
  ['VER', 4],
  ['LANGUAGE', 10],
  ['SIZE', 8, true],
  ['SCOPE', 18],
  ['LOCAL', 6],
];

function row(cells: string[], trailing: string): string {
  return [
    ...cells.map((cell, i) => {
      const [, width, alignRight] = COLUMNS[i];
      return alignRight ? cell.padStart(width) : cell.padEnd(width);
    }),
    trailing,
  ].join('  ');
}

export function deliverableHeader(): string {
  return row(
    COLUMNS.map(([label]) => label),
    'TITLE',
  );
}

// Vault state: installed and current (✓), installed but outdated (↑), or ''.
function localState(deliverable: Deliverable, vault: VaultManifest): string {
  const entry = vault[deliverable.name];
  if (!entry) return '';
  return entry.sha256 === deliverable.sha256 ? `✓ v${entry.version}` : `↑ v${entry.version}`;
}

// Deep link to a validator in the Paramify UI: a locally configured
// paramify-url wins over the server-provided one.
export function validatorLink(link: ParamifyLink, paramifyUrl?: string): string | null {
  if (paramifyUrl) {
    return new URL(`/elements/validators/${link.validatorId}`, paramifyUrl).href;
  }
  return link.url;
}

export function paramifyLinkState(link: ParamifyLink, currentVersion?: number): string {
  if (link.error) return `! live check failed: ${link.error}`;
  if (!link.validator) {
    return '✗ validator missing in Paramify (`fde paramify sync` recreates it)';
  }
  if (link.inSync) return `✓ in sync (v${link.syncedVersion})`;
  const current = currentVersion === undefined ? '' : `, current v${currentVersion}`;
  return `↑ out of date (synced v${link.syncedVersion}${current}) — run \`fde paramify sync\``;
}

export function deliverableLine(deliverable: Deliverable, vault: VaultManifest): string {
  const teams = deliverable.teams.map((team) => team.name).join(',');
  const scope = deliverable.isPublic ? `public${teams ? ` (${teams})` : ''}` : teams || 'private';
  return row(
    [
      deliverable.name,
      `v${deliverable.version}`,
      deliverable.language ?? '-',
      formatSize(deliverable.size),
      scope,
      localState(deliverable, vault),
    ],
    deliverable.title,
  );
}
