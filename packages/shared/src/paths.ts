import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve a path under the monorepo root, located from this package's
// position on disk (packages/shared/dist → three levels up).
//
// Deliberately built with dirname/join rather than
// `new URL(..., import.meta.url)`: bundlers (e.g. Turbopack, which bundles
// symlinked workspace packages despite serverExternalPackages) statically
// rewrite the URL form into build-time asset references, which either fails
// the build or silently points at a stale copy inside the build output.
export function repoRoot(...segments: string[]): string {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..', ...segments);
}
