import { Args, Flags } from '@oclif/core';
import type { ParamifyLinkResponse } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { validatorLink } from '../../format.js';
import { requireSession } from '../../session.js';

export default class ParamifyLinkCommand extends BaseCommand {
  static description = 'Create a deliverable as a validator in Paramify and link it';

  static examples = [
    '<%= config.bin %> paramify link evidence-collector',
    '<%= config.bin %> paramify link evidence-collector --team fedramp',
  ];

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  static flags = {
    team: Flags.string({
      description:
        'team whose Paramify API key to use (default: the remembered scope, then the only eligible team)',
    }),
  };

  async run(): Promise<ParamifyLinkResponse> {
    const { args, flags } = await this.parse(ParamifyLinkCommand);
    const session = await requireSession(this);

    const team = flags.team ?? session.team;
    const response = await session.api.paramifyLink(args.name, team);
    const { link } = response;
    this.log(
      `Created Paramify validator ${link.validatorId} for ${args.name} (team ${link.team}).`,
    );
    const url = validatorLink(link, session.paramifyUrl);
    if (url) this.log(`  ${url}`);
    return response;
  }
}
