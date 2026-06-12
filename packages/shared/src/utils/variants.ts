import type { ExerciseContent } from '../types/exercise';

type GenerateFn<T> = (level: number, seed: number) => ExerciseContent<T>;

/**
 * Produces N unique variants by incrementing the base seed.
 * Guarantees: same (level, baseSeed, count) → same variant array.
 */
export function generateVariants<T>(
  generate: GenerateFn<T>,
  level: number,
  baseSeed: number,
  count: number,
): ExerciseContent<T>[] {
  return Array.from({ length: count }, (_, i) => generate(level, baseSeed + i));
}
