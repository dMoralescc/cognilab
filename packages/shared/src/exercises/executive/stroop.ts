import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type StroopColor = 'rojo' | 'azul' | 'verde' | 'amarillo';
export type TrialType = 'congruent' | 'incongruent';

export interface StroopTrial {
  id: number;
  word: string;           // color word written
  inkColor: StroopColor;  // color of the ink
  type: TrialType;
  correctResponse: StroopColor;
}

export interface StroopStimuli {
  trials: StroopTrial[];
  timeLimit: number;
}

export interface StroopTrialResponse {
  trialId: number;
  response: StroopColor;
  reactionTimeMs: number;
}

export type StroopResponse = StroopTrialResponse[];

const COLORS: StroopColor[] = ['rojo', 'azul', 'verde', 'amarillo'];

interface LevelParams { trials: number; incongruentRate: number; timeLimitMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 10, incongruentRate: 0.0,  timeLimitMs: 4000, timeLimit: 80 },
  2: { trials: 15, incongruentRate: 0.3,  timeLimitMs: 3500, timeLimit: 90 },
  3: { trials: 20, incongruentRate: 0.5,  timeLimitMs: 3000, timeLimit: 90 },
  4: { trials: 24, incongruentRate: 0.7,  timeLimitMs: 2500, timeLimit: 90 },
  5: { trials: 30, incongruentRate: 0.8,  timeLimitMs: 2000, timeLimit: 90 },
};

export function generate(level: number, seed: number): ExerciseContent<StroopStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const incCount = Math.round(p.trials * p.incongruentRate);
  const types = [...Array(incCount).fill('incongruent'), ...Array(p.trials - incCount).fill('congruent')] as TrialType[];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = types[i] as TrialType; types[i] = types[j] as TrialType; types[j] = tmp;
  }
  const trials: StroopTrial[] = types.map((type, id) => {
    const inkColor = COLORS[Math.floor(rng() * COLORS.length)] as StroopColor;
    let word: StroopColor;
    if (type === 'congruent') { word = inkColor; }
    else {
      const others = COLORS.filter((c) => c !== inkColor);
      word = others[Math.floor(rng() * others.length)] as StroopColor;
    }
    return { id, word, inkColor, type, correctResponse: inkColor };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, timeLimit: p.timeLimit } };
}

export function evaluate(s: StroopStimuli, r: StroopResponse): TrialResult<StroopStimuli, StroopResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: StroopStimuli, r: StroopResponse): ExerciseSummary {
  const { hits, errors, meanRt, congruentRt, incongruentRt } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt,
    rawData: { congruentRt, incongruentRt, stroopEffect: (incongruentRt ?? 0) - (congruentRt ?? 0) } };
}

function computeMetrics(s: StroopStimuli, r: StroopResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, errors = 0;
  const allRts: number[] = [], conRts: number[] = [], incRts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    if (resp?.response === t.correctResponse) {
      hits++; allRts.push(resp.reactionTimeMs);
      if (t.type === 'congruent') conRts.push(resp.reactionTimeMs);
      else incRts.push(resp.reactionTimeMs);
    } else errors++;
  }
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  return { hits, errors, meanRt: avg(allRts) ?? 0, congruentRt: avg(conRts), incongruentRt: avg(incRts) };
}
