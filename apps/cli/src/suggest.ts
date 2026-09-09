import type { Session } from './session.js';

// "Did you mean …?" suffix when a deliverable name is unknown to the server,
// drawn from everything the user can see (their teams + the marketplace).
// Best-effort: suggestion lookups must never mask the original error.
export async function suggestDeliverable(session: Session, name: string): Promise<string> {
  try {
    const [{ deliverables }, { deliverables: marketplace }] = await Promise.all([
      session.api.deliverables(undefined),
      session.api.marketplace(),
    ]);
    const names = new Set([...deliverables, ...marketplace].map((deliverable) => deliverable.name));
    return didYouMean(name, [...names]);
  } catch {
    return '';
  }
}

// "Did you mean …?" suffix for not-found errors: close matches (edit distance
// scaled to input length) or prefix matches, best first.
export function didYouMean(input: string, candidates: string[]): string {
  const maxDistance = input.length <= 4 ? 1 : 2;
  const scored = candidates
    .map((candidate) => ({ candidate, distance: levenshtein(input, candidate) }))
    .filter(({ candidate, distance }) => distance <= maxDistance || candidate.startsWith(input))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ candidate }) => candidate);
  return scored.length ? ` Did you mean ${scored.map((name) => `'${name}'`).join(', ')}?` : '';
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return Number.MAX_SAFE_INTEGER;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}
