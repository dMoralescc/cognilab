import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface AlternatingTrial {
  id: number;
  rule: 'A' | 'B';
  stimulus: number; // a number shown to the user
  correctResponse: 'odd' | 'even' | 'greater' | 'less';
}

export interface AlternatingAttentionStimuli {
  trials: AlternatingTrial[];
  ruleA: string; // instruction for rule A (e.g. "¿Par o impar?")
  ruleB: string; // instruction for rule B (e.g. "¿Mayor o menor que 5?")
  timeLimit: number;
}

export interface AlternatingTrialResponse {
  trialId: number;
  response: string; // 'odd' | 'even' | 'greater' | 'less'
  reactionTimeMs: number;
}

export type AlternatingAttentionResponse = AlternatingTrialResponse[];

interface LevelParams { trials: number; switchRate: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 10, switchRate: 0.3, timeLimit: 60 },
  2: { trials: 15, switchRate: 0.4, timeLimit: 70 },
  3: { trials: 20, switchRate: 0.5, timeLimit: 80 },
  4: { trials: 25, switchRate: 0.6, timeLimit: 90 },
  5: { trials: 30, switchRate: 0.7, timeLimit: 100 },
};

export function generate(level: number, seed: number): ExerciseContent<AlternatingAttentionStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  let currentRule: 'A' | 'B' = 'A';
  const trials: AlternatingTrial[] = Array.from({ length: p.trials }, (_, id) => {
    if (id > 0 && rng() < p.switchRate) currentRule = currentRule === 'A' ? 'B' : 'A';
    const stimulus = Math.floor(rng() * 9) + 1;
    const correctResponse: AlternatingTrial['correctResponse'] =
      currentRule === 'A'
        ? stimulus % 2 === 0 ? 'even' : 'odd'
        : stimulus > 5 ? 'greater' : 'less';
    return { id, rule: currentRule, stimulus, correctResponse };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials,
    ruleA: 'Regla A: ¿Es par o impar?',
    ruleB: 'Regla B: ¿Es mayor o menor que 5?',
    timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: AlternatingAttentionStimuli, r: AlternatingAttentionResponse): TrialResult<AlternatingAttentionStimuli, AlternatingAttentionResponse> {
  const { hits, errors } = computeMetrics(s, r);
  const rts = r.filter((resp) => resp.reactionTimeMs > 0).map((resp) => resp.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: AlternatingAttentionStimuli, r: AlternatingAttentionResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  const rts = r.filter((resp) => resp.reactionTimeMs > 0).map((resp) => resp.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors, reactionTimeMs: meanRt, rawData: { totalTrials: s.trials.length } };
}

function computeMetrics(s: AlternatingAttentionStimuli, r: AlternatingAttentionResponse) {
  const map = new Map(r.map((resp) => [resp.trialId, resp]));
  let hits = 0, errors = 0;
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    if (resp?.response === trial.correctResponse) hits++;
    else errors++;
  }
  return { hits, errors };
}
