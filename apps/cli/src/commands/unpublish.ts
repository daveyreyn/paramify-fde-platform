import { Args } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';

export default class Unpublish extends BaseCommand {
  static description = 'Remove a deliverable from the public marketplace (super users only)';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  async run(): Promise<{ deliverable: Deliverable }> {
    const { args } = await this.parse(Unpublish);
    const session = await requireSession(this);

    const { deliverable } = await session.api.unpublishDeliverable(args.name);
    const teams = deliverable.teams.map((team) => team.name).join(', ');
    this.log(
      `${deliverable.name} removed from the marketplace.` +
        (teams ? ` Still shared with: ${teams}` : ''),
    );
    return { deliverable };
  }
}
