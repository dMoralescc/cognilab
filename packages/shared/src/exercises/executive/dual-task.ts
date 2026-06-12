import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Dual task: user does a color task and a parity task simultaneously (similar to divided-attention
// but both tasks are explicitly scored and compared to single-task baselines).
export interface DualTaskTrial {
  id: number;
  colorStimulus: 'red' | 'blue';
  number: number;
  correctColor: 'red' | 'blue';
  correctParity: 'odd' | 'even';
}

export interface DualTaskStimuli {
  trials: DualTaskTrial[];
  durationMs: number;
  isiMs: number;
  timeLimit: number;
}

export interface DualTaskTrialResponse {
  trialId: number;
  colorResponse: 'red' | 'blue' | null;
  parityResponse: 'odd' | 'even' | null;
  reactionTimeMs: number;
}

export type DualTaskResponse = DualTaskTrialResponse[];

interface LevelParams { trials: number; durationMs: number; isiMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 8,  durationMs: 4000, isiMs: 1500, timeLimit: 80 },
  2: { trials: 12, durationMs: 3000, isiMs: 1200, timeLimit: 100 },
  3: { trials: 16, durationMs: 2500, isiMs: 1000, timeLimit: 110 },
  4: { trials: 20, durationMs: 2000, isiMs: 800,  timeLimit: 120 },
  5: { trials: 24, durationMs: 1500, isiMs: 600,  timeLimit: 130 },
};

export function generate(level: number, seed: number): ExerciseContent<DualTaskStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const trials: DualTaskTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const color = Math.floor(rng() * 2) === 0 ? 'red' : 'blue' as 'red' | 'blue';
    const number = Math.floor(rng() * 9) + 1;
    return {
      id,
      colorStimulus: color,
      number,
      correctColor: color,
      correctParity: number % 2 === 0 ? 'even' : 'odd',
    };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, durationMs: p.durationMs, isiMs: p.isiMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: DualTaskStimuli, r: DualTaskResponse): TrialResult<DualTaskStimuli, DualTaskResponse> {
  const { colorHits, parityHits, total } = computeMetrics(s, r);
  const bothHits = Math.min(colorHits, parityHits);
  const meanRt = r.filter((x) => x.reactionTimeMs > 0).reduce((a, b, _, arr) => a + b.reactionTimeMs / arr.length, 0);
  return { isCorrect: bothHits === total, reactionTimeMs: Math.round(meanRt), stimulus: s, response: r };
}

export function summarize(s: DualTaskStimuli, r: DualTaskResponse): ExerciseSummary {
  const { colorHits, parityHits, total } = computeMetrics(s, r);
  const hits = colorHits + parityHits;
  const errors = (total - colorHits) + (total - parityHits);
  const rts = r.filter((x) => x.reactionTimeMs > 0).map((x) => x.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors, reactionTimeMs: meanRt, rawData: { colorHits, parityHits, totalTrials: total } };
}

function computeMetrics(s: DualTaskStimuli, r: DualTaskResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let colorHits = 0, parityHits = 0;
  for (const t of s.trials) {
    const resp = map.get(t.id);
    if (resp?.colorResponse === t.correctColor) colorHits++;
    if (resp?.parityResponse === t.correctParity) parityHits++;
  }
  return { colorHits, parityHits, total: s.trials.length };
}
