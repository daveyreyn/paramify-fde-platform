import { Args } from '@oclif/core';
import { ApiError, type Deliverable, type DeliverableVersion } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { formatSize } from '../format.js';
import { requireSession } from '../session.js';
import { suggestDeliverable } from '../suggest.js';

export default class Versions extends BaseCommand {
  static description = 'List the preserved versions of a deliverable';

  static args = {
    name: Args.string({ description: 'deliverable name', required: true }),
  };

  async run(): Promise<{
    name: string;
    currentVersion: number;
    versions: DeliverableVersion[];
  }> {
    const { args } = await this.parse(Versions);
    const session = await requireSession(this);

    let deliverable: Deliverable;
    let versions: DeliverableVersion[];
    try {
      [{ deliverable }, { versions }] = await Promise.all([
        session.api.deliverable(args.name),
        session.api.deliverableVersions(args.name),
      ]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const hint = await suggestDeliverable(session, args.name);
        this.error(`No deliverable named '${args.name}'.${hint}`, { code: 'not_found' });
      }
      throw error;
    }

    this.log(
      [
        'VER'.padEnd(5),
        'SIZE'.padStart(8),
        'SHA256'.padEnd(14),
        'UPLOADED'.padEnd(12),
        'FILE',
      ].join('  '),
    );
    for (const version of versions) {
      const current = version.version === deliverable.version ? '*' : ' ';
      this.log(
        [
          `v${version.version}${current}`.padEnd(5),
          formatSize(version.size).padStart(8),
          `${version.sha256.slice(0, 12)}…`.padEnd(14),
          version.createdAt.slice(0, 10).padEnd(12),
          version.fileName,
        ].join('  '),
      );
    }
    this.log(`\n* current — install an older one with \`fde install ${args.name} --version <n>\``);
    return { name: args.name, currentVersion: deliverable.version, versions };
  }
}
