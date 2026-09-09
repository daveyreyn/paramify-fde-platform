import { Args } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';

export default class Publish extends BaseCommand {
  static description = 'Publish a deliverable to the public marketplace (super users only)';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  async run(): Promise<{ deliverable: Deliverable }> {
    const { args } = await this.parse(Publish);
    const session = await requireSession(this);

    const { deliverable } = await session.api.publishDeliverable(args.name);
    this.log(`${deliverable.name} v${deliverable.version} is now public in the marketplace.`);
    return { deliverable };
  }
}
