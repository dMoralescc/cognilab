import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Task 1: color identification (red/blue)
// Task 2: number parity (odd/even)
export interface DividedAttentionTrial {
  id: number;
  colorSymbol: string;   // '■' colored
  colorLabel: 'red' | 'blue';
  number: number;
  correctColor: 'red' | 'blue';
  correctParity: 'odd' | 'even';
}

export interface DividedAttentionStimuli {
  trials: DividedAttentionTrial[];
  stimulusDurationMs: number;
  isiMs: number;
  timeLimit: number;
}

export interface DividedAttentionTrialResponse {
  trialId: number;
  colorResponse: 'red' | 'blue' | null;
  parityResponse: 'odd' | 'even' | null;
  reactionTimeMs: number;
}

export type DividedAttentionResponse = DividedAttentionTrialResponse[];

interface LevelParams { trials: number; stimulusDurationMs: number; isiMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 10, stimulusDurationMs: 3000, isiMs: 1500, timeLimit: 60 },
  2: { trials: 15, stimulusDurationMs: 2500, isiMs: 1200, timeLimit: 75 },
  3: { trials: 20, stimulusDurationMs: 2000, isiMs: 1000, timeLimit: 90 },
  4: { trials: 25, stimulusDurationMs: 1500, isiMs: 800,  timeLimit: 100 },
  5: { trials: 30, stimulusDurationMs: 1000, isiMs: 600,  timeLimit: 110 },
};

const COLORS: Array<'red' | 'blue'> = ['red', 'blue'];

export function generate(level: number, seed: number): ExerciseContent<DividedAttentionStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const trials: DividedAttentionTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const colorLabel = COLORS[Math.floor(rng() * 2)] as 'red' | 'blue';
    const number = Math.floor(rng() * 9) + 1;
    return {
      id,
      colorSymbol: '■',
      colorLabel,
      number,
      correctColor: colorLabel,
      correctParity: number % 2 === 0 ? 'even' : 'odd',
    };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, stimulusDurationMs: p.stimulusDurationMs, isiMs: p.isiMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: DividedAttentionStimuli, r: DividedAttentionResponse): TrialResult<DividedAttentionStimuli, DividedAttentionResponse> {
  const { colorHits, parityHits, total } = computeMetrics(s, r);
  const bothCorrect = Math.min(colorHits, parityHits);
  const rts = r.filter((x) => x.reactionTimeMs > 0).map((x) => x.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { isCorrect: bothCorrect === total, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: DividedAttentionStimuli, r: DividedAttentionResponse): ExerciseSummary {
  const { colorHits, parityHits, total } = computeMetrics(s, r);
  const hits = colorHits + parityHits;
  const errors = (total - colorHits) + (total - parityHits);
  const rts = r.filter((x) => x.reactionTimeMs > 0).map((x) => x.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors, reactionTimeMs: meanRt, rawData: { colorHits, parityHits, totalTrials: total } };
}

function computeMetrics(s: DividedAttentionStimuli, r: DividedAttentionResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let colorHits = 0, parityHits = 0;
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    if (resp?.colorResponse === trial.correctColor) colorHits++;
    if (resp?.parityResponse === trial.correctParity) parityHits++;
  }
  return { colorHits, parityHits, total: s.trials.length };
}
