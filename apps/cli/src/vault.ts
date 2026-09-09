import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface VaultEntry {
  fileName: string;
  sha256: string;
  version: number;
  installedAt: string;
}

export type VaultManifest = Record<string, VaultEntry>;

// Canonical install location: one directory per deliverable plus a manifest.
export function vaultDir(): string {
  const base = process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share');
  return join(base, 'fde', 'vault');
}

export function installedPath(name: string, entry: VaultEntry): string {
  return join(vaultDir(), name, entry.fileName);
}

function manifestPath(): string {
  return join(vaultDir(), 'vault.json');
}

export async function readManifest(): Promise<VaultManifest> {
  try {
    return JSON.parse(await readFile(manifestPath(), 'utf8')) as VaultManifest;
  } catch {
    return {};
  }
}

export async function writeManifest(manifest: VaultManifest): Promise<void> {
  await mkdir(vaultDir(), { recursive: true });
  await writeFile(manifestPath(), JSON.stringify(manifest, null, 2) + '\n');
}
