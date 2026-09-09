import { Args } from '@oclif/core';
import type { Team } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class TeamsCreate extends BaseCommand {
  static description = 'Create a team (super users only)';

  static args = {
    name: Args.string({ description: 'team name', required: true }),
  };

  async run(): Promise<{ team: Team }> {
    const { args } = await this.parse(TeamsCreate);
    const session = await requireSession(this);

    const { team } = await session.api.createTeam(args.name);
    this.log(`Created team ${team.name}. Add members with \`fde teams add ${team.name} <email>\`.`);
    return { team };
  }
}
