import { z } from 'zod';

const EnvSchema = z.object({
  // Absolute file: URL override for the sqlite database; defaults to
  // packages/db/prisma/dev.db (resolved in @paramify/db) when unset.
  DATABASE_URL: z.string().startsWith('file:').optional(),
  // Where deliverable files live; only 'local' is implemented today (S3 later).
  STORAGE_PROVIDER: z.enum(['local']).default('local'),
  // Root directory for the local provider; defaults to <repo>/.storage.
  STORAGE_DIR: z.string().optional(),
  // Base URL of the Paramify instance validators sync to (e.g.
  // https://app.paramify.com). Unset disables the /paramify endpoints; the
  // workspace is implied by each team's API key, so no workspace id is needed.
  PARAMIFY_URL: z.url().optional(),
  // "0" makes `prisma db seed` skip the sample deliverables (the e2e flow
  // test seeds a scratch database that must start empty).
  SEED_SAMPLES: z.enum(['0', '1']).default('1'),
  // Comma-separated emails seeded by `prisma db seed`.
  USERS: z
    .string()
    .default('test@paramify.com')
    .transform((value) =>
      value
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.email())),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

// Reads process.env only. Loading the root .env file is the entrypoint's job
// (next.config.ts and prisma.config.ts both do) — touching the filesystem here
// breaks when bundlers rewrite import.meta.url.
export function getEnv(): Env {
  cached ??= EnvSchema.parse(process.env);
  return cached;
}
