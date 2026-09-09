import type { Command } from '@oclif/core';
import { ApiClient } from '@paramify/shared';

import { readConfig } from './config.js';

export const DEFAULT_API_URL = 'http://localhost:3001';

export interface Session {
  api: ApiClient;
  apiUrl: string;
  // Effective team scope (FDE_TEAM, else the scope saved by `fde teams use`).
  team?: string;
  // Paramify instance URL for validator deep links (FDE_PARAMIFY_URL, else
  // `fde config set paramify-url`); the server's PARAMIFY_URL is the fallback.
  paramifyUrl?: string;
}

// Credentials: FDE_TOKEN / FDE_API_URL / FDE_TEAM env vars take precedence over
// ~/.config/fde/config.json, so scripts and agents can run stateless — no
// `fde login` mutating the user's saved credentials, no shared-config races.
export async function requireSession(command: Command): Promise<Session> {
  const stored = await readConfig();
  const token = process.env.FDE_TOKEN || stored?.token;
  if (!token) {
    command.error('Not logged in. Run `fde login`, or set FDE_TOKEN (and FDE_API_URL).', {
      code: 'not_authenticated',
    });
  }
  const apiUrl = process.env.FDE_API_URL || stored?.apiUrl || DEFAULT_API_URL;
  const team = process.env.FDE_TEAM || stored?.team;
  const paramifyUrl = process.env.FDE_PARAMIFY_URL || stored?.paramifyUrl;
  return { api: new ApiClient({ baseUrl: apiUrl, token }), apiUrl, team, paramifyUrl };
}

// Team scope: explicit flag > FDE_TEAM / remembered config > sole membership.
export async function resolveTeam(
  command: Command,
  session: Session,
  flagTeam?: string,
): Promise<string | undefined> {
  if (flagTeam) return flagTeam;
  if (session.team) return session.team;
  const { teams } = await session.api.teams();
  if (teams.length > 1) {
    const names = teams.map((team) => team.name).join(', ');
    command.error(
      `You belong to multiple teams (${names}); pass --team, set FDE_TEAM, ` +
        'or run `fde teams use <name>`.',
      { code: 'team_ambiguous' },
    );
  }
  return teams[0]?.name;
}
