import { BaseCommand } from '../../base-command.js';
import { configPath, readConfig } from '../../config.js';

// What `fde config --json` returns; the token is reported as present/absent
// only, never echoed.
interface ConfigView {
  path: string;
  exists: boolean;
  apiUrl?: string;
  paramifyUrl?: string;
  team?: string;
  tokenPresent: boolean;
}

export default class Config extends BaseCommand {
  static description = 'Show the CLI configuration';

  async run(): Promise<ConfigView> {
    await this.parse(Config);
    const path = configPath();
    const config = await readConfig();
    if (!config) {
      this.log(`No config file at ${path} yet. Run \`fde login\` to create one.`);
      return { path, exists: false, tokenPresent: false };
    }
    this.log(`config file:   ${path}`);
    this.log(`api-url:       ${config.apiUrl}`);
    this.log(`paramify-url:  ${config.paramifyUrl ?? '(unset — using the server’s PARAMIFY_URL)'}`);
    this.log(`team:          ${config.team ?? '(unset)'}`);
    this.log(
      `token:         ${config.token ? `${config.token.slice(0, 8)}… (hidden)` : '(unset)'}`,
    );
    return {
      path,
      exists: true,
      apiUrl: config.apiUrl,
      paramifyUrl: config.paramifyUrl,
      team: config.team,
      tokenPresent: Boolean(config.token),
    };
  }
}
