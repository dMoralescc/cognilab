import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface DigitSpanStimuli {
  sequence: number[];
  direction: 'forward' | 'backward';
  timeLimit: number;
}

export type DigitSpanResponse = number[];

interface LevelParams { length: number; direction: 'forward' | 'backward'; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { length: 3, direction: 'forward',  timeLimit: 20 },
  2: { length: 4, direction: 'forward',  timeLimit: 25 },
  3: { length: 5, direction: 'forward',  timeLimit: 30 },
  4: { length: 5, direction: 'backward', timeLimit: 35 },
  5: { length: 6, direction: 'backward', timeLimit: 40 },
};

export function generate(level: number, seed: number): ExerciseContent<DigitSpanStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const sequence = Array.from({ length: p.length }, () => Math.floor(rng() * 10));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    sequence, direction: p.direction, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: DigitSpanStimuli, r: DigitSpanResponse): TrialResult<DigitSpanStimuli, DigitSpanResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: DigitSpanStimuli, r: DigitSpanResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { length: s.sequence.length, direction: s.direction } };
}

function computeMetrics(s: DigitSpanStimuli, r: DigitSpanResponse) {
  const expected = s.direction === 'backward' ? [...s.sequence].reverse() : s.sequence;
  let hits = 0, errors = 0;
  for (let i = 0; i < expected.length; i++) {
    if (r[i] === expected[i]) hits++;
    else errors++;
  }
  return { hits, errors };
}
