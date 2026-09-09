import { BaseCommand } from '../base-command.js';
import {
  deliverableHeader,
  deliverableLine,
  withLocal,
  type DeliverableWithLocal,
} from '../format.js';
import { requireSession } from '../session.js';
import { readManifest } from '../vault.js';

export default class Marketplace extends BaseCommand {
  static description = 'List publicly available marketplace deliverables';

  async run(): Promise<{ deliverables: DeliverableWithLocal[] }> {
    await this.parse(Marketplace);
    const session = await requireSession(this);
    const [{ deliverables }, vault] = await Promise.all([
      session.api.marketplace(),
      readManifest(),
    ]);
    const rows = deliverables.map((deliverable) => withLocal(deliverable, vault));

    if (!rows.length) {
      this.log('The marketplace is empty.');
    } else {
      this.log(deliverableHeader());
      for (const deliverable of rows) {
        this.log(`${deliverableLine(deliverable, vault)}  (${deliverable.installCount} installs)`);
      }
    }
    return { deliverables: rows };
  }
}
