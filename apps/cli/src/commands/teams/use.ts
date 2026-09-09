import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { readConfig, writeConfig } from '../../config.js';
import { requireSession } from '../../session.js';

export default class TeamsUse extends BaseCommand {
  static description = 'Set the remembered team scope used by upload/list';

  static args = {
    team: Args.string({ description: 'team name', required: true }),
  };

  async run(): Promise<{ team: string }> {
    const { args } = await this.parse(TeamsUse);
    const session = await requireSession(this);

    const { teams } = await session.api.teams();
    if (!teams.some((team) => team.name === args.team)) {
      this.error(
        `You are not a member of '${args.team}'. Your teams: ${
          teams.map((team) => team.name).join(', ') || '(none)'
        }`,
        { code: 'not_a_member' },
      );
    }

    // The scope is remembered in the config file; a session created purely from
    // FDE_TOKEN has nothing on disk to update — use FDE_TEAM there instead.
    const stored = await readConfig();
    if (!stored) {
      this.error(
        'No saved credentials to update (running with FDE_TOKEN?). Set FDE_TEAM instead.',
        {
          code: 'no_saved_config',
        },
      );
    }
    await writeConfig({ ...stored, team: args.team });
    this.log(`Team scope set to ${args.team}`);
    return { team: args.team };
  }
}
