import {
  CreateUserResponseSchema,
  DeliverableResponseSchema,
  DeliverablesResponseSchema,
  HealthResponseSchema,
  MeResponseSchema,
  ParamifyLinkResponseSchema,
  ParamifyStatusResponseSchema,
  ParamifySyncResponseSchema,
  TeamResponseSchema,
  TeamsResponseSchema,
  UsersResponseSchema,
  VersionsResponseSchema,
  type CreateUserRequest,
  type CreateUserResponse,
  type DeliverableResponse,
  type DeliverablesResponse,
  type HealthResponse,
  type MeResponse,
  type ParamifyLinkResponse,
  type ParamifyStatusResponse,
  type ParamifySyncResponse,
  type TeamResponse,
  type TeamsResponse,
  type UploadDeliverableRequest,
  type UsersResponse,
  type VersionsResponse,
} from './schemas.js';

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Server-provided error text, suitable for showing directly to users. */
    readonly detail: string,
    requestLabel: string,
  ) {
    super(`${requestLabel}: ${status} ${detail}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async health(): Promise<HealthResponse> {
    return HealthResponseSchema.parse(await this.json('/api/health'));
  }

  async me(): Promise<MeResponse> {
    return MeResponseSchema.parse(await this.json('/api/v1/me'));
  }

  async teams(): Promise<TeamsResponse> {
    return TeamsResponseSchema.parse(await this.json('/api/v1/teams'));
  }

  async deliverables(team?: string): Promise<DeliverablesResponse> {
    const query = team ? `?team=${encodeURIComponent(team)}` : '';
    return DeliverablesResponseSchema.parse(await this.json(`/api/v1/deliverables${query}`));
  }

  async marketplace(): Promise<DeliverablesResponse> {
    return DeliverablesResponseSchema.parse(await this.json('/api/v1/marketplace'));
  }

  async deliverable(name: string): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(await this.json(deliverablePath(name)));
  }

  async deliverableVersions(name: string): Promise<VersionsResponse> {
    return VersionsResponseSchema.parse(await this.json(deliverablePath(name, '/versions')));
  }

  async deleteDeliverable(name: string): Promise<void> {
    await this.send('DELETE', deliverablePath(name));
  }

  async deleteDeliverableVersion(name: string, version: number): Promise<void> {
    await this.send('DELETE', deliverablePath(name, `/versions/${version}`));
  }

  async uploadDeliverable(
    metadata: UploadDeliverableRequest,
    file: { name: string; data: Uint8Array },
  ): Promise<DeliverableResponse> {
    const form = new FormData();
    form.set('metadata', JSON.stringify(metadata));
    form.set('file', new Blob([file.data]), file.name);
    return DeliverableResponseSchema.parse(
      await this.json('/api/v1/deliverables', { method: 'POST', body: form }),
    );
  }

  async downloadDeliverable(name: string, version?: number): Promise<Uint8Array> {
    const query = version === undefined ? '' : `?version=${version}`;
    const response = await this.request(deliverablePath(name, `/content${query}`));
    return new Uint8Array(await response.arrayBuffer());
  }

  async shareDeliverable(name: string, teams: string[]): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(
      await this.post(deliverablePath(name, '/teams'), { teams }),
    );
  }

  async unshareDeliverable(name: string, teams: string[]): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(
      await this.send('DELETE', deliverablePath(name, '/teams'), { teams }),
    );
  }

  async publishDeliverable(name: string): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(await this.post(deliverablePath(name, '/publish')));
  }

  async unpublishDeliverable(name: string): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(
      await this.send('DELETE', deliverablePath(name, '/publish')),
    );
  }

  async saveDeliverable(name: string, team: string): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(
      await this.post(deliverablePath(name, '/save'), { team }),
    );
  }

  async unsaveDeliverable(name: string, team: string): Promise<DeliverableResponse> {
    return DeliverableResponseSchema.parse(
      await this.send('DELETE', deliverablePath(name, '/save'), { team }),
    );
  }

  // --- Paramify validator sync ---

  async paramifyStatus(name: string): Promise<ParamifyStatusResponse> {
    return ParamifyStatusResponseSchema.parse(await this.json(deliverablePath(name, '/paramify')));
  }

  async paramifyLink(name: string, team?: string): Promise<ParamifyLinkResponse> {
    return ParamifyLinkResponseSchema.parse(
      await this.post(deliverablePath(name, '/paramify'), { team }),
    );
  }

  async paramifySync(name: string, team?: string): Promise<ParamifySyncResponse> {
    return ParamifySyncResponseSchema.parse(
      await this.send('PUT', deliverablePath(name, '/paramify'), { team }),
    );
  }

  async paramifyUnlink(name: string, team?: string): Promise<void> {
    await this.send('DELETE', deliverablePath(name, '/paramify'), { team });
  }

  async setTeamParamifyKey(team: string, paramifyApiKey: string | null): Promise<void> {
    await this.send('PATCH', `/api/v1/teams/${encodeURIComponent(team)}`, { paramifyApiKey });
  }

  async logout(): Promise<void> {
    await this.request('/api/v1/logout', { method: 'POST' });
  }

  // --- user & team management (super users only) ---

  async users(): Promise<UsersResponse> {
    return UsersResponseSchema.parse(await this.json('/api/v1/users'));
  }

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return CreateUserResponseSchema.parse(await this.post('/api/v1/users', request));
  }

  async deleteUser(email: string): Promise<void> {
    await this.send('DELETE', `/api/v1/users/${encodeURIComponent(email)}`);
  }

  async createTeam(name: string): Promise<TeamResponse> {
    return TeamResponseSchema.parse(await this.post('/api/v1/teams', { name }));
  }

  async deleteTeam(name: string): Promise<void> {
    await this.send('DELETE', `/api/v1/teams/${encodeURIComponent(name)}`);
  }

  async addTeamMember(team: string, email: string): Promise<void> {
    await this.post(`/api/v1/teams/${encodeURIComponent(team)}/members`, { email });
  }

  async removeTeamMember(team: string, email: string): Promise<void> {
    await this.send('DELETE', `/api/v1/teams/${encodeURIComponent(team)}/members`, { email });
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    const { baseUrl, token } = this.options;
    const headers = new Headers(init?.headers);
    if (token) headers.set('authorization', `Bearer ${token}`);
    const response = await fetch(new URL(path, baseUrl), { ...init, headers });
    if (!response.ok) {
      throw new ApiError(
        response.status,
        await errorDetail(response),
        `${init?.method ?? 'GET'} ${path}`,
      );
    }
    return response;
  }

  private async json(path: string, init?: RequestInit): Promise<unknown> {
    return (await this.request(path, init)).json();
  }

  private async post(path: string, body?: unknown): Promise<unknown> {
    return this.send('POST', path, body);
  }

  private async send(method: string, path: string, body?: unknown): Promise<unknown> {
    return this.json(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}

function deliverablePath(name: string, suffix = ''): string {
  return `/api/v1/deliverables/${encodeURIComponent(name)}${suffix}`;
}

async function errorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.clone().json()) as { error?: unknown };
    if (typeof body.error === 'string') return body.error;
  } catch {
    // body wasn't JSON
  }
  return response.statusText;
}
