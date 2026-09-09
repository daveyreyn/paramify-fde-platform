import { Args, Flags } from '@oclif/core';
import type { User } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class UsersAdd extends BaseCommand {
  static description = 'Create a user (super users only); prints their one-time initial password';

  static args = {
    email: Args.string({ description: 'email address', required: true }),
  };

  static flags = {
    name: Flags.string({ description: 'display name' }),
    super: Flags.boolean({ description: 'grant super-user rights', default: false }),
  };

  async run(): Promise<{ user: User; initialPassword: string }> {
    const { args, flags } = await this.parse(UsersAdd);
    const session = await requireSession(this);

    const { user, initialPassword } = await session.api.createUser({
      email: args.email,
      name: flags.name,
      isSuper: flags.super,
    });
    this.log(
      `Created user ${user.email}${user.isSuper ? ' [super]' : ''} — ` +
        `initial password (save it now, it is not shown again): ${initialPassword}`,
    );
    this.log(`Add them to a team with \`fde teams add <team> ${user.email}\`.`);
    return { user, initialPassword };
  }
}
