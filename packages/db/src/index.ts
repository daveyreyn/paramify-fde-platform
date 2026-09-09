import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { getEnv, repoRoot } from '@paramify/shared';

import { PrismaClient } from './generated/client.js';

let client: PrismaClient | undefined;

// Lazy so importing this package has no side effects (e.g. during `next build`).
export function getPrisma(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: databaseUrl() }),
  });
  return client;
}

// Defaults to the dev database inside this package so local dev needs no env
// and works from any app's cwd. Deploys override DATABASE_URL with an absolute
// file: URL (e.g. the litestream-replicated file).
function databaseUrl(): string {
  return getEnv().DATABASE_URL ?? `file:${repoRoot('packages/db/prisma/dev.db')}`;
}

export * from './generated/client.js';
