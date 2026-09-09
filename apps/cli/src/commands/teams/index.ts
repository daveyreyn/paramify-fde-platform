import type { Team } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class Teams extends BaseCommand {
  static description = 'List your teams and the active scope';

  async run(): Promise<{ teams: Team[]; activeTeam: string | null }> {
    await this.parse(Teams);
    const session = await requireSession(this);
    const { teams } = await session.api.teams();
    if (!teams.length) {
      this.log('You are not a member of any team.');
    }
    for (const team of teams) {
      this.log(`${team.name}${team.name === session.team ? '  (active scope)' : ''}`);
    }
    return { teams, activeTeam: session.team ?? null };
  }
}
