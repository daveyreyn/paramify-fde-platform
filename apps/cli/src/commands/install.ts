import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Args, Flags } from '@oclif/core';
import { ApiError, type Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';
import { suggestDeliverable } from '../suggest.js';
import { installedPath, readManifest, vaultDir, writeManifest } from '../vault.js';

interface InstallResult {
  name: string;
  version: number;
  fileName: string;
  sha256: string;
  path: string;
  status: 'installed' | 'already-installed';
}

export default class Install extends BaseCommand {
  static description = 'Install a deliverable into the local vault';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    version: Flags.integer({
      description: 'install a specific preserved version instead of the latest',
    }),
  };

  async run(): Promise<InstallResult> {
    const { args, flags } = await this.parse(Install);
    const session = await requireSession(this);

    let deliverable: Deliverable;
    try {
      ({ deliverable } = await session.api.deliverable(args.name));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const hint = await suggestDeliverable(session, args.name);
        this.error(`No deliverable named '${args.name}'.${hint}`, { code: 'not_found' });
      }
      throw error;
    }
    let target: { version: number; fileName: string; sha256: string } = deliverable;
    if (flags.version !== undefined && flags.version !== deliverable.version) {
      const { versions } = await session.api.deliverableVersions(args.name);
      const found = versions.find((version) => version.version === flags.version);
      if (!found) {
        const available = versions.map((version) => `v${version.version}`).join(', ');
        this.error(
          `${args.name} has no version ${flags.version}. Preserved versions: ${available}.`,
          { code: 'not_found' },
        );
      }
      target = found;
    }

    const manifest = await readManifest();
    const entry = manifest[deliverable.name];
    if (
      entry &&
      entry.sha256 === target.sha256 &&
      existsSync(installedPath(deliverable.name, entry))
    ) {
      this.log(`${deliverable.name} v${target.version} is already installed and up to date.`);
      return {
        name: deliverable.name,
        version: target.version,
        fileName: entry.fileName,
        sha256: entry.sha256,
        path: installedPath(deliverable.name, entry),
        status: 'already-installed',
      };
    }

    const data = await session.api.downloadDeliverable(deliverable.name, target.version);
    const sha256 = createHash('sha256').update(data).digest('hex');
    if (sha256 !== target.sha256) {
      this.error(
        `Checksum mismatch for ${deliverable.name}: expected ${target.sha256}, got ${sha256}`,
        { code: 'checksum_mismatch' },
      );
    }

    const dir = join(vaultDir(), deliverable.name);
    // Recreate the directory so files from prior versions don't linger.
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const path = join(dir, target.fileName);
    // Executable so `fde run` can exec it directly via shebang.
    await writeFile(path, data, { mode: 0o755 });

    manifest[deliverable.name] = {
      fileName: target.fileName,
      sha256: target.sha256,
      version: target.version,
      installedAt: new Date().toISOString(),
    };
    await writeManifest(manifest);
    this.log(`Installed ${deliverable.name} v${target.version} → ${path}`);
    return {
      name: deliverable.name,
      version: target.version,
      fileName: target.fileName,
      sha256: target.sha256,
      path,
      status: 'installed',
    };
  }
}
