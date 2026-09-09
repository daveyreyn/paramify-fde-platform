import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { readConfig, writeConfig } from '../../config.js';

// Only the optional fields can be unset; api-url and token are required.
const KEYS = { 'paramify-url': 'paramifyUrl', team: 'team' } as const;

export default class ConfigUnset extends BaseCommand {
  static description = 'Remove an optional CLI configuration value';

  static args = {
    key: Args.string({ required: true, options: Object.keys(KEYS) }),
  };

  async run(): Promise<{ key: string }> {
    const { args } = await this.parse(ConfigUnset);
    const config = await readConfig();
    if (!config) this.error('No config yet — run `fde login` first.');

    const next = { ...config };
    delete next[KEYS[args.key as keyof typeof KEYS]];
    await writeConfig(next);
    this.log(`${args.key} unset`);
    return { key: args.key };
  }
}
