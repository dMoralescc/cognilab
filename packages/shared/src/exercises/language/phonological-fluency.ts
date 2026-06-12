import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface PhonologicalFluencyStimuli {
  letter: string;
  timeLimit: number;
  excludedCategories: string[];
}

export interface PhonologicalFluencyResponse {
  words: string[];
  elapsedMs: number;
}

interface LevelParams { letter: string; timeLimit: number; excludedCategories: string[] }
const LEVELS: LevelParams[] = [
  { letter: 'M', timeLimit: 90, excludedCategories: [] },
  { letter: 'S', timeLimit: 75, excludedCategories: [] },
  { letter: 'P', timeLimit: 60, excludedCategories: ['nombres propios'] },
  { letter: 'F', timeLimit: 50, excludedCategories: ['nombres propios', 'lugares'] },
  { letter: 'R', timeLimit: 45, excludedCategories: ['nombres propios', 'lugares'] },
];

export function generate(level: number, _seed: number): ExerciseContent<PhonologicalFluencyStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli: { letter: p.letter, timeLimit: p.timeLimit, excludedCategories: p.excludedCategories } };
}

export function summarize(stimuli: PhonologicalFluencyStimuli, response: PhonologicalFluencyResponse): ExerciseSummary {
  const letter = stimuli.letter.toLowerCase();
  const seen = new Set<string>();
  let perseverations = 0;
  let intrusions = 0;
  for (const w of response.words) {
    const key = w.trim().toLowerCase();
    if (!key) continue;
    if (!key.startsWith(letter)) { intrusions++; continue; }
    if (seen.has(key)) perseverations++;
    else seen.add(key);
  }
  return {
    hits: seen.size,
    errors: intrusions + perseverations,
    reactionTimeMs: response.elapsedMs,
    rawData: { uniqueValid: seen.size, perseverations, intrusions, totalWords: response.words.length },
  };
}
