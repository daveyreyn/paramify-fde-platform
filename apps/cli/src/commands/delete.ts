import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../base-command.js';
import { requireSession } from '../session.js';

export default class Delete extends BaseCommand {
  static description =
    'Permanently delete a deliverable (or one old version of it) from the server';

  static examples = [
    '<%= config.bin %> delete evidence-collector --yes',
    '<%= config.bin %> delete evidence-collector --version 2 --yes',
  ];

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    version: Flags.integer({
      description: 'delete only this version (the current version cannot be deleted)',
    }),
    yes: Flags.boolean({ description: 'confirm the deletion', default: false }),
  };

  async run(): Promise<{ name: string; version: number | null; deleted: true }> {
    const { args, flags } = await this.parse(Delete);
    const session = await requireSession(this);

    const target =
      flags.version === undefined
        ? `'${args.name}' and all its versions`
        : `'${args.name}' v${flags.version}`;
    if (!flags.yes) {
      this.error(
        `This permanently deletes ${target} from the server. Re-run with --yes to confirm.`,
        { code: 'confirmation_required' },
      );
    }

    if (flags.version === undefined) {
      await session.api.deleteDeliverable(args.name);
    } else {
      await session.api.deleteDeliverableVersion(args.name, flags.version);
    }
    this.log(`Deleted ${target}.`);
    return { name: args.name, version: flags.version ?? null, deleted: true };
  }
}
