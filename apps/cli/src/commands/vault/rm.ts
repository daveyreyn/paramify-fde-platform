import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { didYouMean } from '../../suggest.js';
import { readManifest, vaultDir, writeManifest } from '../../vault.js';

export default class VaultRm extends BaseCommand {
  static description = 'Remove an installed deliverable from the vault';

  static args = {
    name: Args.string({ description: 'installed deliverable name', required: true }),
  };

  async run(): Promise<{ name: string; removed: true }> {
    const { args } = await this.parse(VaultRm);
    const manifest = await readManifest();
    if (!manifest[args.name]) {
      const hint = didYouMean(args.name, Object.keys(manifest));
      this.error(`'${args.name}' is not installed.${hint}`, { code: 'not_installed' });
    }

    await rm(join(vaultDir(), args.name), { recursive: true, force: true });
    delete manifest[args.name];
    await writeManifest(manifest);
    this.log(`Removed ${args.name} from the vault.`);
    return { name: args.name, removed: true };
  }
}
