export interface ExerciseResult {
  hits: number;
  errors: number;
  level: number;
}

/**
 * Suggest the next level for an exercise based on recent performance.
 * - accuracy >= 80% for the last `windowSize` sessions → level up
 * - accuracy <  40% → level down
 * - otherwise → stay
 */
export function suggestLevel(
  results: ExerciseResult[],
  minLevel: number,
  maxLevel: number,
  windowSize = 3,
): number {
  if (results.length === 0) return minLevel;

  const recent = results.slice(-windowSize);
  const lastLevel = recent[recent.length - 1]!.level;
  const totalHits = recent.reduce((s, r) => s + r.hits, 0);
  const totalAttempts = recent.reduce((s, r) => s + r.hits + r.errors, 0);

  if (totalAttempts === 0) return lastLevel;

  const accuracy = totalHits / totalAttempts;

  if (accuracy >= 0.8 && lastLevel < maxLevel) return lastLevel + 1;
  if (accuracy < 0.4 && lastLevel > minLevel) return lastLevel - 1;
  return lastLevel;
}
