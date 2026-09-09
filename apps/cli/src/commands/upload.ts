import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { Args, Flags } from '@oclif/core';
import type { Deliverable } from '@paramify/shared';

import { BaseCommand } from '../base-command.js';
import { formatSize } from '../format.js';
import { requireSession, resolveTeam } from '../session.js';

export default class Upload extends BaseCommand {
  static description = 'Upload a local file as a deliverable';

  static examples = [
    '<%= config.bin %> upload ./collect.py --title "Evidence collector" --tags evidence,aws',
  ];

  static args = {
    path: Args.string({ description: 'path to a local file', required: true }),
  };

  static flags = {
    name: Flags.string({ description: 'unique slug (default: derived from the file name)' }),
    title: Flags.string({ description: 'human-readable title (default: the slug)' }),
    description: Flags.string({ description: 'what this deliverable does' }),
    tags: Flags.string({ description: 'comma-separated tags' }),
    team: Flags.string({
      description: 'team(s) to attach (default: your active team scope)',
      multiple: true,
    }),
    private: Flags.boolean({
      description: 'attach no team, even if a team scope is active',
      exclusive: ['team'],
    }),
  };

  async run(): Promise<{ deliverable: Deliverable }> {
    const { args, flags } = await this.parse(Upload);
    const session = await requireSession(this);

    let data: Buffer;
    try {
      data = await readFile(args.path);
    } catch {
      this.error(`Cannot read file: ${args.path}`, { code: 'file_unreadable' });
    }

    const fileName = basename(args.path);
    const name = flags.name ?? slugify(fileName);
    if (!name) {
      this.error('Could not derive a slug from the file name; pass --name.', {
        code: 'invalid_name',
      });
    }

    let teams: string[] = [];
    if (!flags.private) {
      const scoped = flags.team?.length ? flags.team : [await resolveTeam(this, session)];
      teams = scoped.filter((team): team is string => !!team);
    }

    const { deliverable } = await session.api.uploadDeliverable(
      {
        name,
        title: flags.title,
        description: flags.description,
        tags: flags.tags
          ?.split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        teams,
      },
      { name: fileName, data },
    );

    const attached = deliverable.teams.map((team) => team.name).join(', ') || '(no team — private)';
    this.log(
      `Uploaded ${deliverable.name} v${deliverable.version} ` +
        `(${formatSize(deliverable.size)}) → ${attached}`,
    );
    return { deliverable };
  }
}

function slugify(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
