import { Args } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class TeamsAdd extends BaseCommand {
  static description = 'Add a user to a team (super users only)';

  static args = {
    team: Args.string({ description: 'team name', required: true }),
    email: Args.string({ description: 'user email', required: true }),
  };

  async run(): Promise<{ team: string; email: string; added: true }> {
    const { args } = await this.parse(TeamsAdd);
    const session = await requireSession(this);

    await session.api.addTeamMember(args.team, args.email);
    this.log(`Added ${args.email} to team ${args.team}.`);
    return { team: args.team, email: args.email, added: true };
  }
}
