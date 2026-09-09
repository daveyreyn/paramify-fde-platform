import { Args, Flags } from '@oclif/core';
import type { ParamifySyncResponse } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { validatorLink } from '../../format.js';
import { requireSession } from '../../session.js';

export default class ParamifySync extends BaseCommand {
  static description =
    'Full sync to Paramify: create the validator if needed (even if it was deleted there) and update it to the current metadata';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({
      description: 'sync only the link created via this team (default: every linked team)',
    }),
  };

  async run(): Promise<ParamifySyncResponse> {
    const { args, flags } = await this.parse(ParamifySync);
    const session = await requireSession(this);

    const response = await session.api.paramifySync(args.name, flags.team);
    for (const link of response.links) {
      this.log(
        `Synced ${args.name} v${link.syncedVersion} → validator ${link.validatorId} (team ${link.team}).`,
      );
      const url = validatorLink(link, session.paramifyUrl);
      if (url) this.log(`  ${url}`);
    }
    return response;
  }
}
