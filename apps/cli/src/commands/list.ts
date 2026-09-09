import { Flags } from '@oclif/core';

import { BaseCommand } from '../base-command.js';
import {
  deliverableHeader,
  deliverableLine,
  withLocal,
  type DeliverableWithLocal,
} from '../format.js';
import { requireSession } from '../session.js';
import { readManifest } from '../vault.js';

export default class List extends BaseCommand {
  static description = 'List deliverables visible to you';

  static flags = {
    team: Flags.string({ description: 'only deliverables attached to this team' }),
    all: Flags.boolean({ description: 'ignore the active team scope and list everything visible' }),
  };

  async run(): Promise<{ team: string | null; deliverables: DeliverableWithLocal[] }> {
    const { flags } = await this.parse(List);
    const session = await requireSession(this);

    const team = flags.all ? undefined : (flags.team ?? session.team);
    const [{ deliverables }, vault] = await Promise.all([
      session.api.deliverables(team),
      readManifest(),
    ]);
    const rows = deliverables.map((deliverable) => withLocal(deliverable, vault));

    if (!rows.length) {
      this.log(team ? `No deliverables in team '${team}'.` : 'No deliverables visible to you.');
    } else {
      if (team) this.log(`Deliverables in team '${team}':`);
      this.log(deliverableHeader());
      for (const deliverable of rows) {
        this.log(deliverableLine(deliverable, vault));
      }
    }
    return { team: team ?? null, deliverables: rows };
  }
}
