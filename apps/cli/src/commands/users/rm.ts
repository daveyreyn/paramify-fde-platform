import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class UsersRm extends BaseCommand {
  static description = 'Delete a user (super users only)';

  static args = {
    email: Args.string({ description: 'email address', required: true }),
  };

  static flags = {
    yes: Flags.boolean({ description: 'confirm the deletion', default: false }),
  };

  async run(): Promise<{ email: string; deleted: true }> {
    const { args, flags } = await this.parse(UsersRm);
    const session = await requireSession(this);

    if (!flags.yes) {
      this.error(
        `This permanently deletes the user '${args.email}' and revokes their tokens. ` +
          'Re-run with --yes to confirm.',
        { code: 'confirmation_required' },
      );
    }

    await session.api.deleteUser(args.email);
    this.log(`Deleted user ${args.email}.`);
    return { email: args.email, deleted: true };
  }
}
