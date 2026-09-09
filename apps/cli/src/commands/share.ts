import { Args, Flags } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';

export default class Share extends BaseCommand {
  static description =
    'Share a deliverable with more teams (your own teams; any team if you are super)';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({ description: 'team to share with', multiple: true, required: true }),
  };

  async run(): Promise<{ deliverable: Deliverable }> {
    const { args, flags } = await this.parse(Share);
    const session = await requireSession(this);

    const { deliverable } = await session.api.shareDeliverable(args.name, flags.team);
    this.log(
      `${deliverable.name} is now shared with: ${deliverable.teams
        .map((team) => team.name)
        .join(', ')}`,
    );
    return { deliverable };
  }
}
