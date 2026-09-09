import { Args, Flags } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';

export default class Unshare extends BaseCommand {
  static description =
    'Remove a deliverable from teams (your own teams; any team if you are super)';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({ description: 'team to remove', multiple: true, required: true }),
  };

  async run(): Promise<{ deliverable: Deliverable }> {
    const { args, flags } = await this.parse(Unshare);
    const session = await requireSession(this);

    const { deliverable } = await session.api.unshareDeliverable(args.name, flags.team);
    const teams = deliverable.teams.map((team) => team.name).join(', ');
    this.log(`${deliverable.name} is now shared with: ${teams || '(no teams)'}`);
    return { deliverable };
  }
}
