import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface NBackTrial {
  id: number;
  stimulus: string;
  isTarget: boolean;   // true if stimulus matches n positions back
  durationMs: number;
  isiMs: number;
}

export interface NBackStimuli {
  trials: NBackTrial[];
  n: number;
  timeLimit: number;
}

export interface NBackTrialResponse {
  trialId: number;
  responded: boolean;
  reactionTimeMs: number;
}

export type NBackResponse = NBackTrialResponse[];

const VISUAL_STIMULI = ['A','B','C','D','E','F','G','H'];

interface LevelParams { n: number; trials: number; targetRate: number; durationMs: number; isiMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { n: 1, trials: 15, targetRate: 0.30, durationMs: 1500, isiMs: 1000, timeLimit: 60 },
  2: { n: 1, trials: 20, targetRate: 0.30, durationMs: 1200, isiMs: 800,  timeLimit: 70 },
  3: { n: 2, trials: 20, targetRate: 0.25, durationMs: 1200, isiMs: 800,  timeLimit: 80 },
  4: { n: 2, trials: 25, targetRate: 0.25, durationMs: 1000, isiMs: 700,  timeLimit: 90 },
  5: { n: 3, trials: 30, targetRate: 0.25, durationMs: 1000, isiMs: 600,  timeLimit: 100 },
};

export function generate(level: number, seed: number): ExerciseContent<NBackStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const sequence: string[] = [];
  const isTarget: boolean[] = [];
  for (let i = 0; i < p.trials; i++) {
    if (i >= p.n && rng() < p.targetRate && sequence[i - p.n] !== undefined) {
      sequence.push(sequence[i - p.n]!);
      isTarget.push(true);
    } else {
      const stim = VISUAL_STIMULI[Math.floor(rng() * VISUAL_STIMULI.length)] as string;
      sequence.push(stim);
      isTarget.push(false);
    }
  }
  const trials: NBackTrial[] = sequence.map((stim, id) => ({
    id, stimulus: stim, isTarget: isTarget[id]!, durationMs: p.durationMs, isiMs: p.isiMs,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, n: p.n, timeLimit: p.timeLimit } };
}

export function evaluate(s: NBackStimuli, r: NBackResponse): TrialResult<NBackStimuli, NBackResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: NBackStimuli, r: NBackResponse): ExerciseSummary {
  const { hits, errors, omissions, falseAlarms, meanRt } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt, rawData: { omissions, falseAlarms, n: s.n } };
}

function computeMetrics(s: NBackStimuli, r: NBackResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, omissions = 0, falseAlarms = 0;
  const rts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    const responded = resp?.responded ?? false;
    if (t.isTarget) {
      if (responded) { hits++; rts.push(resp!.reactionTimeMs); }
      else omissions++;
    } else {
      if (responded) falseAlarms++;
    }
  }
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { hits, errors: omissions + falseAlarms, omissions, falseAlarms, meanRt };
}
