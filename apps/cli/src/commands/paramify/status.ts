import { Args } from '@oclif/core';
import type { ParamifyStatusResponse } from '@paramify/shared';

import { BaseCommand } from '../../base-command.js';
import { paramifyLinkState, validatorLink } from '../../format.js';
import { requireSession } from '../../session.js';

export default class ParamifyStatus extends BaseCommand {
  static description = 'Show whether a deliverable is linked to a Paramify validator (live check)';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  async run(): Promise<ParamifyStatusResponse> {
    const { args } = await this.parse(ParamifyStatus);
    const session = await requireSession(this);

    const response = await session.api.paramifyStatus(args.name);
    const { version, links } = response;
    if (!links.length) {
      this.log(`${args.name} is not linked to a Paramify validator.`);
      this.log(`Run \`fde paramify link ${args.name}\` to create one.`);
      return response;
    }
    for (const link of links) {
      this.log(`${link.team}: validator ${link.validatorId}`);
      this.log(`  ${paramifyLinkState(link, version)}`);
      const url = validatorLink(link, session.paramifyUrl);
      if (url) this.log(`  ${url}`);
    }
    return response;
  }
}
