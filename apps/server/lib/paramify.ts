import type { Team } from '@paramify/db';
import { getEnv, ParamifyValidatorSchema, type ParamifyValidator } from '@paramify/shared';

import { HttpError } from '@/lib/api';

// Minimal client for Paramify's external REST API (/api/v0). Each API key is
// bound to a single Paramify workspace, so requests never carry a workspace
// id — the team's key selects the workspace.

export function paramifyBaseUrl(): string | null {
  return getEnv().PARAMIFY_URL ?? null;
}

// Deep link to a validator in the Paramify UI. The UI resolves the workspace
// from the viewer's session, so the path has no workspace segment.
export function validatorUrl(validatorId: string): string | null {
  const base = paramifyBaseUrl();
  return base ? new URL(`/elements/validators/${validatorId}`, base).href : null;
}

export function paramifyClientForTeam(team: Pick<Team, 'name' | 'paramifyApiKey'>): ParamifyClient {
  const base = paramifyBaseUrl();
  if (!base) throw new HttpError(503, 'PARAMIFY_URL is not configured on the server');
  if (!team.paramifyApiKey) {
    throw new HttpError(
      400,
      `team '${team.name}' has no Paramify API key configured (a super user can set one on the team page or with \`fde teams set-key\`)`,
    );
  }
  return new ParamifyClient(base, team.paramifyApiKey);
}

// Sentinel for an upstream 404 the caller treats as "validator gone".
const MISSING = Symbol('missing');

export class ParamifyClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async createValidator(fields: { name: string; statement: string }): Promise<ParamifyValidator> {
    // Paramify requires regex/validationRules even for a rule-less validator.
    const body = { ...fields, type: 'AUTOMATED', regex: '', validationRules: [] };
    return asValidator(await this.send('POST', '/api/v0/validators', body));
  }

  async getValidator(id: string): Promise<ParamifyValidator | null> {
    const result = await this.send('GET', `/api/v0/validators/${id}`, undefined, true);
    return result === MISSING ? null : asValidator(result);
  }

  // null means the validator no longer exists in Paramify.
  async updateValidator(
    id: string,
    fields: { name: string; statement: string },
  ): Promise<ParamifyValidator | null> {
    const result = await this.send('PATCH', `/api/v0/validators/${id}`, fields, true);
    return result === MISSING ? null : asValidator(result);
  }

  async deleteValidator(id: string): Promise<void> {
    // An upstream 404 is fine: already gone is the state we want.
    await this.send('DELETE', `/api/v0/validators/${id}`, undefined, true);
  }

  private async send(
    method: string,
    path: string,
    body?: unknown,
    missingOk = false,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(new URL(path, this.baseUrl), {
        method,
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new HttpError(502, `could not reach Paramify at ${this.baseUrl}`);
    }
    if (response.status === 404 && missingOk) return MISSING;
    if (!response.ok) {
      const detail = await errorMessage(response);
      if (response.status === 401 || response.status === 403) {
        throw new HttpError(502, `Paramify rejected the team's API key: ${detail}`);
      }
      throw new HttpError(response.status >= 500 ? 502 : 400, `Paramify: ${detail}`);
    }
    // DELETE responds 200 with an empty body.
    const text = await response.text();
    return text ? JSON.parse(text) : undefined;
  }
}

function asValidator(raw: unknown): ParamifyValidator {
  // Strips fields the sync does not manage (regex, rules).
  return ParamifyValidatorSchema.parse(raw);
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === 'string') return body.message;
  } catch {
    // body wasn't JSON
  }
  return `${response.status} ${response.statusText}`;
}
