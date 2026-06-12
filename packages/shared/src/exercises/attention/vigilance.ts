import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface VigilanceTrial {
  id: number;
  isSignal: boolean;
  symbol: string;
  durationMs: number;
}

export interface VigilanceStimuli {
  trials: VigilanceTrial[];
  signalSymbol: string;
  noiseSymbol: string;
  timeLimit: number;
}

export interface VigilanceTrialResponse {
  trialId: number;
  responded: boolean;
  reactionTimeMs: number;
}

export type VigilanceResponse = VigilanceTrialResponse[];

interface LevelParams { trials: number; signalRate: number; durationMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 30, signalRate: 0.30, durationMs: 1200, timeLimit: 180 },
  2: { trials: 40, signalRate: 0.25, durationMs: 1000, timeLimit: 240 },
  3: { trials: 50, signalRate: 0.20, durationMs: 900,  timeLimit: 300 },
  4: { trials: 60, signalRate: 0.15, durationMs: 800,  timeLimit: 360 },
  5: { trials: 80, signalRate: 0.10, durationMs: 700,  timeLimit: 480 },
};

const SIGNAL = '★';
const NOISE = '✦';

export function generate(level: number, seed: number): ExerciseContent<VigilanceStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const signalCount = Math.round(p.trials * p.signalRate);
  const types = [...Array(signalCount).fill(true), ...Array(p.trials - signalCount).fill(false)] as boolean[];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = types[i] as boolean; types[i] = types[j] as boolean; types[j] = tmp;
  }
  const trials: VigilanceTrial[] = types.map((isSignal, id) => ({
    id, isSignal, symbol: isSignal ? SIGNAL : NOISE, durationMs: p.durationMs,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, signalSymbol: SIGNAL, noiseSymbol: NOISE, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: VigilanceStimuli, r: VigilanceResponse): TrialResult<VigilanceStimuli, VigilanceResponse> {
  const { hits, omissions, falseAlarms } = computeMetrics(s, r);
  const rts = r.filter((resp) => resp.responded).map((resp) => resp.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  void hits;
  return { isCorrect: omissions === 0 && falseAlarms === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: VigilanceStimuli, r: VigilanceResponse): ExerciseSummary {
  const { hits, omissions, falseAlarms } = computeMetrics(s, r);
  const rts = r.filter((resp) => resp.responded).map((resp) => resp.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors: omissions + falseAlarms, reactionTimeMs: meanRt,
    rawData: { omissions, falseAlarms, signalCount: s.trials.filter((t) => t.isSignal).length } };
}

function computeMetrics(s: VigilanceStimuli, r: VigilanceResponse) {
  const map = new Map(r.map((resp) => [resp.trialId, resp]));
  let hits = 0, omissions = 0, falseAlarms = 0;
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    const responded = resp?.responded ?? false;
    if (trial.isSignal) { if (responded) hits++; else omissions++; }
    else { if (responded) falseAlarms++; }
  }
  return { hits, omissions, falseAlarms };
}
