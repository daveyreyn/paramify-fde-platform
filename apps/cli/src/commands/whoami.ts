import type { Team, User } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';
import { readManifest, vaultDir } from '../vault.js';

// The one-call orientation command: who am I, against which server, with what
// team scope, and what is installed locally.
interface WhoamiResult {
  user: User;
  teams: Team[];
  activeTeam: string | null;
  apiUrl: string;
  paramifyUrl: string | null;
  vault: { dir: string; installed: number };
}

export default class Whoami extends BaseCommand {
  static description = 'Show the authenticated user, server, team scope, and vault state';

  async run(): Promise<WhoamiResult> {
    await this.parse(Whoami);
    const session = await requireSession(this);
    const [{ user }, { teams }, manifest] = await Promise.all([
      session.api.me(),
      session.api.teams(),
      readManifest(),
    ]);
    const installed = Object.keys(manifest).length;

    this.log(`${user.email}${user.name ? ` (${user.name})` : ''}${user.isSuper ? ' [super]' : ''}`);
    this.log(`Server: ${session.apiUrl}`);
    this.log(`Teams: ${teams.map((team) => team.name).join(', ') || '(none)'}`);
    this.log(`Active team scope: ${session.team ?? '(none)'}`);
    this.log(`Vault: ${installed} installed (${vaultDir()})`);

    return {
      user,
      teams,
      activeTeam: session.team ?? null,
      apiUrl: session.apiUrl,
      paramifyUrl: session.paramifyUrl ?? null,
      vault: { dir: vaultDir(), installed },
    };
  }
}
