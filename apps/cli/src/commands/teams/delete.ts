import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class TeamsDelete extends BaseCommand {
  static description =
    'Delete a team (super users only); memberships and shares are detached, deliverables kept';

  static args = {
    name: Args.string({ description: 'team name', required: true }),
  };

  static flags = {
    yes: Flags.boolean({ description: 'confirm the deletion', default: false }),
  };

  async run(): Promise<{ team: string; deleted: true }> {
    const { args, flags } = await this.parse(TeamsDelete);
    const session = await requireSession(this);

    if (!flags.yes) {
      this.error(
        `This deletes the team '${args.name}' and detaches its members and deliverables. ` +
          'Re-run with --yes to confirm.',
        { code: 'confirmation_required' },
      );
    }

    await session.api.deleteTeam(args.name);
    this.log(`Deleted team ${args.name}.`);
    return { team: args.name, deleted: true };
  }
}
