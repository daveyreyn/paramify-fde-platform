import { Args, Flags } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession, resolveTeam } from '../session.js';

export default class Save extends BaseCommand {
  static description = 'Save a marketplace deliverable to a team so it shows up in the team view';

  static args = {
    name: Args.string({ description: 'marketplace deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({ description: 'target team (default: your active team scope)' }),
  };

  async run(): Promise<{ team: string; deliverable: Deliverable }> {
    const { args, flags } = await this.parse(Save);
    const session = await requireSession(this);

    const team = await resolveTeam(this, session, flags.team);
    if (!team) {
      this.error('No team scope; pass --team, set FDE_TEAM, or run `fde teams use <name>`.', {
        code: 'no_team_scope',
      });
    }

    const { deliverable } = await session.api.saveDeliverable(args.name, team);
    this.log(`Saved ${deliverable.name} to team '${team}'.`);
    return { team, deliverable };
  }
}
