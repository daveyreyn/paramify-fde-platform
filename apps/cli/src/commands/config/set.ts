import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { readConfig, writeConfig, type CliConfig } from '../../config.js';

// Settable keys → CliConfig fields. The token is excluded on purpose: it is
// minted by `fde login` and must match the api-url it came from.
const KEYS = {
  'api-url': 'apiUrl',
  'paramify-url': 'paramifyUrl',
  team: 'team',
} as const;

export default class ConfigSet extends BaseCommand {
  static description = 'Set a CLI configuration value';

  static examples = [
    '<%= config.bin %> config set api-url https://fde.paramify.com',
    '<%= config.bin %> config set paramify-url https://app.paramify.com',
  ];

  static args = {
    key: Args.string({ required: true, options: Object.keys(KEYS) }),
    value: Args.string({ required: true }),
  };

  async run(): Promise<{ key: string; value: string }> {
    const { args } = await this.parse(ConfigSet);
    const config = await readConfig();
    if (!config) this.error('No config yet — run `fde login` first.');

    const key = args.key as keyof typeof KEYS;
    if (key !== 'team') assertUrl(this, args.value);
    const next: CliConfig = { ...config, [KEYS[key]]: args.value };
    await writeConfig(next);
    this.log(`${args.key} set to ${args.value}`);
    if (key === 'api-url') {
      this.log('Note: tokens are per-server; run `fde login` if this points somewhere new.');
    }
    return { key: args.key, value: args.value };
  }
}

function assertUrl(command: ConfigSet, value: string): void {
  try {
    new URL(value);
  } catch {
    command.error(`'${value}' is not a valid URL`);
  }
}
