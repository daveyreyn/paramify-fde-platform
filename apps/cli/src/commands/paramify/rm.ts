import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../base-command.js';
import { requireSession } from '../../session.js';

export default class ParamifyRm extends BaseCommand {
  static description = 'Delete the linked validator in Paramify and remove the link';

  static examples = ['<%= config.bin %> paramify rm evidence-collector --yes'];

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({
      description: 'which link to remove when linked via multiple teams',
    }),
    yes: Flags.boolean({ description: 'confirm the deletion', default: false }),
  };

  async run(): Promise<{ name: string; team?: string; removed: true }> {
    const { args, flags } = await this.parse(ParamifyRm);
    const session = await requireSession(this);

    if (!flags.yes) {
      this.error(
        `This deletes the validator linked to '${args.name}' from Paramify and removes the link. Re-run with --yes to confirm.`,
      );
    }

    await session.api.paramifyUnlink(args.name, flags.team);
    this.log(`Deleted the Paramify validator for ${args.name} and removed the link.`);
    return { name: args.name, team: flags.team, removed: true };
  }
}
