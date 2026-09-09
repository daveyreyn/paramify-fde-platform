import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

// Single root .env for the whole monorepo (real env vars take precedence).
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch {
  // no .env file
}

// Resolve the dev sqlite path here, in plain Node: Turbopack bundles the
// workspace packages and rewrites their import.meta.url-based fallback, which
// breaks inside Server Components.
process.env.DATABASE_URL ??= `file:${fileURLToPath(
  new URL('../../packages/db/prisma/dev.db', import.meta.url),
)}`;

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module, and all three packages resolve paths
  // via import.meta.url — require them at runtime, don't bundle them.
  serverExternalPackages: ['@paramify/db', '@paramify/shared', '@paramify/storage'],
};

export default nextConfig;
