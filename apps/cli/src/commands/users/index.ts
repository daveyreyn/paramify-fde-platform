import type { AdminUser } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class Users extends BaseCommand {
  static description = 'List all users (super users only)';

  async run(): Promise<{ users: AdminUser[] }> {
    await this.parse(Users);
    const session = await requireSession(this);

    const { users } = await session.api.users();
    this.log(['EMAIL'.padEnd(32), 'NAME'.padEnd(20), 'SUPER'.padEnd(6), 'TEAMS'].join('  '));
    for (const user of users) {
      this.log(
        [
          user.email.padEnd(32),
          (user.name ?? '-').padEnd(20),
          (user.isSuper ? 'yes' : '').padEnd(6),
          user.teams.map((team) => team.name).join(', ') || '(none)',
        ].join('  '),
      );
    }
    return { users };
  }
}
