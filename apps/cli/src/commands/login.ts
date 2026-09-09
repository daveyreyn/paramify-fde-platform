import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { Flags } from '@oclif/core';
import { ApiClient, ApiError } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { configPath, writeConfig } from '../config.js';
import { DEFAULT_API_URL } from '../session.js';

const APPROVAL_TIMEOUT_MS = 5 * 60_000;

export default class Login extends BaseCommand {
  static description = 'Authenticate with the Paramify FDE platform';

  static flags = {
    'api-url': Flags.string({
      default: DEFAULT_API_URL,
      description: 'platform base URL',
    }),
    'no-browser': Flags.boolean({
      default: false,
      description: 'print the approval URL instead of opening a browser',
    }),
    token: Flags.string({
      description: 'skip the browser flow and use this platform token (for scripts/CI)',
      env: 'FDE_TOKEN',
    }),
  };

  async run(): Promise<{ email: string; apiUrl: string; configPath: string }> {
    const { flags } = await this.parse(Login);
    const apiUrl = flags['api-url'];

    const token = flags.token ?? (await this.browserLogin(apiUrl, !flags['no-browser']));
    const email = await this.validateToken(new ApiClient({ baseUrl: apiUrl, token }));

    await writeConfig({ apiUrl, token });
    this.log(`Logged in as ${email}. Credentials written to ${configPath()}`);
    return { email, apiUrl, configPath: configPath() };
  }

  private async validateToken(api: ApiClient): Promise<string> {
    try {
      const { user } = await api.me();
      return user.email;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        this.error('The server did not recognize that token.', { code: 'invalid_token' });
      }
      throw error;
    }
  }

  // Progress messages during the approval flow; under --json this.log() is
  // suppressed, but the URL must still reach the user, so fall back to stderr
  // (stdout stays reserved for the JSON result).
  private note(message: string): void {
    if (this.jsonEnabled()) process.stderr.write(`${message}\n`);
    else this.log(message);
  }

  // Loopback flow: serve a one-shot callback on 127.0.0.1, send the user to the
  // platform's approval page, and wait for it to redirect back with a token.
  private async browserLogin(apiUrl: string, openBrowser: boolean): Promise<string> {
    const state = randomBytes(16).toString('hex');
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    const callbackUrl = `http://127.0.0.1:${port}/callback`;

    const approvalUrl = new URL('/cli-auth', apiUrl);
    approvalUrl.searchParams.set('redirect', callbackUrl);
    approvalUrl.searchParams.set('state', state);

    if (openBrowser) {
      this.note('Opening your browser to approve this login. If nothing opens, visit:');
      openInBrowser(approvalUrl.href);
    } else {
      this.note('Visit this URL to approve the login:');
    }
    this.note(`  ${approvalUrl.href}`);

    try {
      return await new Promise<string>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Timed out waiting for browser approval.')),
          APPROVAL_TIMEOUT_MS,
        );
        server.on('request', (request, response) => {
          const url = new URL(request.url ?? '/', callbackUrl);
          const token = url.searchParams.get('token');
          if (url.pathname !== '/callback' || url.searchParams.get('state') !== state || !token) {
            response.writeHead(400, { 'content-type': 'text/plain' });
            response.end('Invalid login callback.');
            return;
          }
          response.writeHead(200, { 'content-type': 'text/html' });
          response.end(
            // window.close() only works for script-opened tabs; the text is the fallback.
            '<script>window.close()</script>' +
              '<p>Logged in. You can close this tab and return to the terminal.</p>',
          );
          clearTimeout(timer);
          resolve(token);
        });
      });
    } finally {
      server.close();
    }
  }
}

function openInBrowser(url: string): void {
  const opener: { command: string; args: string[] } =
    process.platform === 'darwin'
      ? { command: 'open', args: [url] }
      : process.platform === 'win32'
        ? { command: 'cmd', args: ['/c', 'start', '', url] }
        : { command: 'xdg-open', args: [url] };
  spawn(opener.command, opener.args, { detached: true, stdio: 'ignore' }).unref();
}
