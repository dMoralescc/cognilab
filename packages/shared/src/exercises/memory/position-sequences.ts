import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface PositionSequencesStimuli {
  sequence: number[];  // grid cell indices, shown in order
  gridSize: number;
  speedMs: number;     // ms per cell highlight
  timeLimit: number;
}

export type PositionSequencesResponse = number[];  // user-reproduced sequence

interface LevelParams { length: number; gridSize: number; speedMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { length: 3, gridSize: 3, speedMs: 900,  timeLimit: 30 },
  2: { length: 4, gridSize: 3, speedMs: 800,  timeLimit: 35 },
  3: { length: 5, gridSize: 4, speedMs: 700,  timeLimit: 40 },
  4: { length: 6, gridSize: 4, speedMs: 600,  timeLimit: 45 },
  5: { length: 8, gridSize: 4, speedMs: 500,  timeLimit: 55 },
};

export function generate(level: number, seed: number): ExerciseContent<PositionSequencesStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const total = p.gridSize * p.gridSize;
  const sequence = Array.from({ length: p.length }, () => Math.floor(rng() * total));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    sequence, gridSize: p.gridSize, speedMs: p.speedMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: PositionSequencesStimuli, r: PositionSequencesResponse): TrialResult<PositionSequencesStimuli, PositionSequencesResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: PositionSequencesStimuli, r: PositionSequencesResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { length: s.sequence.length } };
}

function computeMetrics(s: PositionSequencesStimuli, r: PositionSequencesResponse) {
  let hits = 0, errors = 0;
  for (let i = 0; i < s.sequence.length; i++) {
    if (r[i] === s.sequence[i]) hits++;
    else errors++;
  }
  return { hits, errors };
}
