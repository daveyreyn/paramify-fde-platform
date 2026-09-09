import { fileURLToPath } from 'node:url';

import { defineConfig } from 'prisma/config';

// Prisma 7 no longer auto-loads .env; load the single root .env.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));
} catch {
  // no .env present (e.g. CI generate-only runs)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Used by migrate/db push (cwd is packages/db for the npm scripts);
  // the runtime client resolves its own URL in src/index.ts.
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
