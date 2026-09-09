import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface CliConfig {
  apiUrl: string;
  token: string;
  // Remembered team scope set by `fde teams use`.
  team?: string;
  // Paramify instance URL for printing validator deep links; when unset the
  // server's PARAMIFY_URL (echoed in link responses) is used instead.
  paramifyUrl?: string;
}

export function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
  return join(base, 'fde', 'config.json');
}

export async function readConfig(): Promise<CliConfig | undefined> {
  try {
    return JSON.parse(await readFile(configPath(), 'utf8')) as CliConfig;
  } catch {
    return undefined;
  }
}

export async function writeConfig(config: CliConfig): Promise<void> {
  const path = configPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2) + '\n');
}
