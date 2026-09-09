import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class TeamsRm extends BaseCommand {
  static description = 'Remove a user from a team (super users only)';

  static args = {
    team: Args.string({ description: 'team name', required: true }),
    email: Args.string({ description: 'user email', required: true }),
  };

  async run(): Promise<{ team: string; email: string; removed: true }> {
    const { args } = await this.parse(TeamsRm);
    const session = await requireSession(this);

    await session.api.removeTeamMember(args.team, args.email);
    this.log(`Removed ${args.email} from team ${args.team}.`);
    return { team: args.team, email: args.email, removed: true };
  }
}
