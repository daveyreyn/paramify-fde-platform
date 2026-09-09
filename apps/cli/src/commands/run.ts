import { spawn } from 'node:child_process';

import { Args } from '@oclif/core';
import { fileExtension } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { didYouMean } from '../suggest.js';
import { installedPath, readManifest } from '../vault.js';

// How to invoke an installed file, by extension; anything unlisted is
// executed directly and relies on its shebang (installs are chmod +x).
const INTERPRETERS: Record<string, string[]> = {
  '.bash': ['bash'],
  '.js': ['node'],
  '.mjs': ['node'],
  '.ps1': ['pwsh'],
  '.py': ['python3'],
  '.rb': ['ruby'],
  '.sh': ['bash'],
  '.ts': ['npx', 'tsx'],
};

export default class Run extends BaseCommand {
  static description = 'Run an installed deliverable from the vault';

  static examples = ['<%= config.bin %> run evidence-collector -- --engagement eng_42'];

  // Pure passthrough: the deliverable owns stdio and the exit code, so a
  // --json flag here would only steal an argument from it.
  static override enableJsonFlag = false;

  // Everything after <name> is passed through to the deliverable.
  static strict = false;

  static args = {
    name: Args.string({ description: 'installed deliverable name', required: true }),
  };

  async run(): Promise<void> {
    const { argv } = await this.parse(Run);
    const [name, ...passthrough] = argv as string[];

    const manifest = await readManifest();
    const entry = manifest[name];
    if (!entry) {
      const hint = didYouMean(name, Object.keys(manifest));
      this.error(`'${name}' is not installed.${hint} Run \`fde install ${name}\` first.`, {
        code: 'not_installed',
      });
    }

    const path = installedPath(name, entry);
    const interpreter = INTERPRETERS[fileExtension(entry.fileName)];
    const [command, ...args] = interpreter
      ? [...interpreter, path, ...passthrough]
      : [path, ...passthrough];

    const exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'inherit' });
      child.on('error', reject);
      child.on('close', (code) => resolve(code ?? 1));
    });
    process.exitCode = exitCode;
  }
}
