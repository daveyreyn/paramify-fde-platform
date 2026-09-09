import { Command, Errors } from '@oclif/core';
import { ApiError } from '@paramify/shared';

// Shared base so expected failures (API errors, server down, this.error calls)
// print as one-line messages. We write them ourselves instead of rethrowing
// because bin/dev.js runs oclif in development mode, where its default
// handler prints a stack trace for every error.
//
// Every command supports --json (oclif's enableJsonFlag): this.log() output is
// suppressed, run()'s return value is printed as JSON, and expected failures
// become `{"error": {"code", "message"}}` on stdout with the same exit code.
// The codes are a stable contract for scripts and agents; message text is not.
export abstract class BaseCommand extends Command {
  static override enableJsonFlag = true;

  protected override async catch(error: Error & { exitCode?: number }): Promise<unknown> {
    const friendly = friendlyError(error);
    if (friendly === undefined) return super.catch(error);

    const exit = (error as { oclif?: { exit?: number | false } }).oclif?.exit;
    const exitCode = typeof exit === 'number' ? exit : 2;
    if (this.jsonEnabled()) {
      this.logJson({ error: friendly });
    } else {
      process.stderr.write(`Error: ${friendly.message}\n`);
    }
    return this.exit(exitCode);
  }
}

interface FriendlyError {
  code: string;
  message: string;
}

function friendlyError(error: Error): FriendlyError | undefined {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        code: 'not_authenticated',
        message: 'Not authenticated — the server rejected your token. Run `fde login` again.',
      };
    }
    return { code: apiErrorCode(error.status), message: error.detail };
  }
  if (isConnectionFailure(error)) {
    return {
      code: 'server_unreachable',
      message: 'Could not reach the server. Is it running? (npm run dev)',
    };
  }
  // this.error(...) inside commands — already a user-facing message; commands
  // can pass a machine-readable code via this.error(msg, { code }).
  if (error instanceof Errors.CLIError && !(error instanceof Errors.ExitError)) {
    return { code: error.code ?? 'cli_error', message: error.message };
  }
  return undefined;
}

function apiErrorCode(status: number): string {
  switch (status) {
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    default:
      return 'api_error';
  }
}

function isConnectionFailure(error: Error): boolean {
  if (error.message !== 'fetch failed') return false;
  const { cause } = error;
  const codes = cause instanceof AggregateError ? cause.errors : [cause];
  return codes.some(
    (e) =>
      e instanceof Error && 'code' in e && typeof e.code === 'string' && e.code.startsWith('E'),
  );
}
