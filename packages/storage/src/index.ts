import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getEnv, repoRoot } from '@paramify/shared';

// Blob storage for deliverable files. Implementations must treat keys as
// opaque identifiers (no hierarchy); an S3 provider slots in next to local.
export interface StorageProvider {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly root: string) {}

  async put(key: string, data: Uint8Array): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await writeFile(this.path(key), data);
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.path(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }

  private path(key: string): string {
    if (!/^[\w.-]+$/.test(key)) throw new Error(`Invalid storage key: ${key}`);
    return join(this.root, key);
  }
}

let provider: StorageProvider | undefined;

// Lazy so importing this package has no side effects (mirrors getPrisma).
export function getStorage(): StorageProvider {
  provider ??= createProvider();
  return provider;
}

function createProvider(): StorageProvider {
  const env = getEnv();
  switch (env.STORAGE_PROVIDER) {
    case 'local':
      return new LocalStorageProvider(env.STORAGE_DIR ?? repoRoot('.storage'));
  }
}
