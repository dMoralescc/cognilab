import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export interface SemanticFluencyStimuli {
  category: string;
  timeLimit: number;
  subcategoryConstraint: string | null;
}

export interface SemanticFluencyResponse {
  words: string[];
  elapsedMs: number;
}

interface LevelParams { category: string; timeLimit: number; subcategoryConstraint: string | null }
const LEVELS: LevelParams[] = [
  { category: 'animales', timeLimit: 90, subcategoryConstraint: null },
  { category: 'frutas y verduras', timeLimit: 75, subcategoryConstraint: null },
  { category: 'ropa', timeLimit: 60, subcategoryConstraint: null },
  { category: 'animales', timeLimit: 50, subcategoryConstraint: 'solo animales del mar' },
  { category: 'alimentos', timeLimit: 45, subcategoryConstraint: 'solo alimentos de color rojo o naranja' },
];

export function generate(level: number, _seed: number): ExerciseContent<SemanticFluencyStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli: { category: p.category, timeLimit: p.timeLimit, subcategoryConstraint: p.subcategoryConstraint } };
}

export function summarize(_stimuli: SemanticFluencyStimuli, response: SemanticFluencyResponse): ExerciseSummary {
  const seen = new Set<string>();
  let perseverations = 0;
  for (const w of response.words) {
    const key = w.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) perseverations++;
    else seen.add(key);
  }
  return {
    hits: seen.size,
    errors: perseverations,
    reactionTimeMs: response.elapsedMs,
    rawData: { uniqueValid: seen.size, perseverations, totalWords: response.words.length },
  };
}
