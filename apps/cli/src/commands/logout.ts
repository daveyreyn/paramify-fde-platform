import { rm } from 'node:fs/promises';

import { ApiClient } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { configPath, readConfig } from '../config.js';

interface LogoutResult {
  revoked: boolean;
  configRemoved: boolean;
  configPath: string;
}

export default class Logout extends BaseCommand {
  static description = 'Log out: revoke the current token and delete saved credentials';

  async run(): Promise<LogoutResult> {
    await this.parse(Logout);
    const config = await readConfig();
    if (!config) {
      this.log('Not logged in.');
      return { revoked: false, configRemoved: false, configPath: configPath() };
    }

    // Best-effort revoke; remove local credentials even if the server is down.
    const api = new ApiClient({ baseUrl: config.apiUrl, token: config.token });
    let revoked = true;
    try {
      await api.logout();
    } catch {
      revoked = false;
      this.warn('Could not revoke the token on the server; removed local credentials anyway.');
    }

    await rm(configPath(), { force: true });
    this.log(`Logged out. Credentials removed from ${configPath()}`);
    return { revoked, configRemoved: true, configPath: configPath() };
  }
}
