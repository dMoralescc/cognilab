import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface ReactionTimeTrial {
  id: number;
  isiMs: number;
  choiceIndex: number | null; // null = simple RT; for choice RT, which option is correct
  options: string[]; // empty for simple RT
}

export interface ReactionTimeStimuli {
  trials: ReactionTimeTrial[];
  stimulusDurationMs: number;
  choiceCount: number;
  timeLimit: number;
}

export interface ReactionTimeTrialResponse {
  trialId: number;
  responded: boolean;
  chosenIndex: number | null;
  reactionTimeMs: number;
}

export type ReactionTimeResponse = ReactionTimeTrialResponse[];

const SIMPLE_STIMULUS = '●';
const CHOICE_OPTIONS = ['◆', '▲', '■', '●'];

interface LevelParams { trials: number; choiceCount: number; isiMs: number; stimulusDurationMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 15, choiceCount: 1, isiMs: 2000, stimulusDurationMs: 2000, timeLimit: 60 },
  2: { trials: 20, choiceCount: 1, isiMs: 1500, stimulusDurationMs: 1500, timeLimit: 60 },
  3: { trials: 20, choiceCount: 2, isiMs: 1200, stimulusDurationMs: 1200, timeLimit: 70 },
  4: { trials: 25, choiceCount: 3, isiMs: 900, stimulusDurationMs: 1000, timeLimit: 80 },
  5: { trials: 30, choiceCount: 4, isiMs: 600, stimulusDurationMs: 800, timeLimit: 90 },
};

export function generate(level: number, seed: number): ExerciseContent<ReactionTimeStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const options = p.choiceCount > 1 ? CHOICE_OPTIONS.slice(0, p.choiceCount) : [];
  const trials: ReactionTimeTrial[] = Array.from({ length: p.trials }, (_, id) => ({
    id,
    isiMs: p.isiMs + Math.floor(rng() * 800 - 400),
    choiceIndex: p.choiceCount > 1 ? Math.floor(rng() * p.choiceCount) : null,
    options,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, stimulusDurationMs: p.stimulusDurationMs, choiceCount: p.choiceCount, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: ReactionTimeStimuli, r: ReactionTimeResponse): TrialResult<ReactionTimeStimuli, ReactionTimeResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt ?? 0, stimulus: s, response: r };
}

export function summarize(s: ReactionTimeStimuli, r: ReactionTimeResponse): ExerciseSummary {
  const { hits, errors, meanRt, anticipations, omissions } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt,
    rawData: { anticipations, omissions, totalTrials: s.trials.length } };
}

function computeMetrics(s: ReactionTimeStimuli, r: ReactionTimeResponse) {
  const map = new Map(r.map((resp) => [resp.trialId, resp]));
  let hits = 0, errors = 0, anticipations = 0, omissions = 0;
  const rts: number[] = [];
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    if (!resp || !resp.responded) { omissions++; errors++; continue; }
    if (resp.reactionTimeMs < 100) { anticipations++; errors++; continue; }
    if (s.choiceCount > 1) {
      if (resp.chosenIndex === trial.choiceIndex) { hits++; rts.push(resp.reactionTimeMs); }
      else { errors++; }
    } else {
      hits++; rts.push(resp.reactionTimeMs);
    }
  }
  const meanRt = rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors, meanRt, anticipations, omissions };
}

export { SIMPLE_STIMULUS };
