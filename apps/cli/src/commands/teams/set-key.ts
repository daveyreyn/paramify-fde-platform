import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class TeamsSetKey extends BaseCommand {
  static description =
    "Set or clear a team's Paramify API key (super only; the key must belong to the Paramify workspace the team's validators should live in)";

  static examples = [
    '<%= config.bin %> teams set-key fedramp --key pk_…',
    'PARAMIFY_API_KEY=pk_… <%= config.bin %> teams set-key fedramp',
    '<%= config.bin %> teams set-key fedramp --clear',
  ];

  static args = {
    team: Args.string({ description: 'team name', required: true }),
  };

  static flags = {
    key: Flags.string({
      description: 'the Paramify API key (needs validator read/write permissions)',
      env: 'PARAMIFY_API_KEY',
      exclusive: ['clear'],
    }),
    clear: Flags.boolean({ description: 'remove the stored key', default: false }),
  };

  async run(): Promise<{ team: string; cleared: boolean }> {
    const { args, flags } = await this.parse(TeamsSetKey);
    if (!flags.key && !flags.clear) {
      this.error('Pass --key <key> (or set PARAMIFY_API_KEY), or --clear to remove it.');
    }
    const session = await requireSession(this);

    await session.api.setTeamParamifyKey(args.team, flags.clear ? null : (flags.key as string));
    this.log(
      flags.clear
        ? `Cleared the Paramify API key for ${args.team}.`
        : `Paramify API key set for ${args.team}. It is stored server-side and never returned.`,
    );
    return { team: args.team, cleared: flags.clear };
  }
}
