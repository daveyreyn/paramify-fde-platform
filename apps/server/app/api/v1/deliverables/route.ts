import { createHash, randomUUID } from 'node:crypto';

import { getPrisma, type Prisma } from '@paramify/db';
import { languageForFile, UploadDeliverableRequestSchema } from '@paramify/shared';
import { getStorage } from '@paramify/storage';
import { NextResponse } from 'next/server';

import { apiError, handleApi, HttpError } from '@/lib/api';
import { getCurrentUser } from '@/lib/current-user';
import {
  deliverableInclude,
  resolveTeams,
  toApiDeliverable,
  type DeliverableRow,
} from '@/lib/deliverables';

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, 'unauthorized');

  const team = new URL(request.url).searchParams.get('team');
  if (team && !user.isSuper && !user.teams.some((t) => t.name === team)) {
    return apiError(403, `not a member of team '${team}'`);
  }

  const visible: Prisma.DeliverableWhereInput = user.isSuper
    ? {}
    : {
        OR: [
          { authorId: user.id },
          { teams: { some: { id: { in: user.teams.map((t) => t.id) } } } },
        ],
      };
  const rows = await getPrisma().deliverable.findMany({
    where: team ? { AND: [visible, { teams: { some: { name: team } } }] } : visible,
    include: deliverableInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ deliverables: rows.map(toApiDeliverable) });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const user = await getCurrentUser(request);
    if (!user) return apiError(401, 'unauthorized');

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new HttpError(400, 'expected a multipart/form-data body');
    }

    const file = form.get('file');
    if (!(file instanceof File)) throw new HttpError(400, 'missing file field');
    if (file.size > MAX_SIZE) throw new HttpError(413, 'file exceeds 100 MB');

    const rawMetadata = form.get('metadata');
    if (typeof rawMetadata !== 'string') throw new HttpError(400, 'missing metadata field');
    let metadata;
    try {
      metadata = UploadDeliverableRequestSchema.parse(JSON.parse(rawMetadata));
    } catch (error) {
      throw new HttpError(
        400,
        `invalid metadata: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const fileName = file.name.split(/[\\/]/).pop() ?? '';
    if (!fileName || fileName.startsWith('.') || fileName.length > 128) {
      throw new HttpError(400, 'invalid file name');
    }

    const teams = await resolveTeams(user, metadata.teams);

    const prisma = getPrisma();
    const existing = await prisma.deliverable.findUnique({
      where: { name: metadata.name },
      include: { teams: true },
    });
    if (existing && existing.authorId !== user.id && !user.isSuper) {
      throw new HttpError(409, `deliverable '${metadata.name}' already exists`);
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const storageKey = randomUUID();
    await getStorage().put(storageKey, data);

    const fileFields = {
      fileName,
      storageKey,
      size: data.byteLength,
      sha256: createHash('sha256').update(data).digest('hex'),
      language: languageForFile(fileName),
    };
    const common = {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      ...fileFields,
    };

    // Prior versions (rows and blobs) are preserved; see DeliverableVersion.
    let row: DeliverableRow;
    if (existing) {
      const connected = new Set(existing.teams.map((team) => team.id));
      const version = existing.version + 1;
      row = await prisma.deliverable.update({
        where: { id: existing.id },
        data: {
          ...common,
          version,
          versions: { create: { version, ...fileFields } },
          teams: { connect: teams.filter((t) => !connected.has(t.id)).map((t) => ({ id: t.id })) },
        },
        include: deliverableInclude,
      });
    } else {
      row = await prisma.deliverable.create({
        data: {
          ...common,
          name: metadata.name,
          title: metadata.title ?? metadata.name,
          authorId: user.id,
          versions: { create: { version: 1, ...fileFields } },
          teams: { connect: teams.map((t) => ({ id: t.id })) },
        },
        include: deliverableInclude,
      });
    }

    return NextResponse.json(
      { deliverable: toApiDeliverable(row) },
      { status: existing ? 200 : 201 },
    );
  });
}
