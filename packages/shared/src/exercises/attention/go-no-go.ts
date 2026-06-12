import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface GoNoGoTrial {
  id: number;
  isGo: boolean;
  symbol: string;
  isiMs: number; // inter-stimulus interval before this trial
}

export interface GoNoGoStimuli {
  trials: GoNoGoTrial[];
  goSymbol: string;
  noGoSymbol: string;
  stimulusDurationMs: number;
  timeLimit: number;
}

export interface GoNoGoTrialResponse {
  trialId: number;
  responded: boolean;
  reactionTimeMs: number; // from stimulus onset; 0 if no response
}

export type GoNoGoResponse = GoNoGoTrialResponse[];

interface LevelParams {
  goRatio: number;
  totalTrials: number;
  stimulusDurationMs: number;
  isiMs: number;
  timeLimit: number;
}

const GO = '◯';
const NO_GO = '✕';

const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { goRatio: 0.80, totalTrials: 20, stimulusDurationMs: 1000, isiMs: 1500, timeLimit: 60 },
  2: { goRatio: 0.75, totalTrials: 25, stimulusDurationMs: 900,  isiMs: 1200, timeLimit: 70 },
  3: { goRatio: 0.70, totalTrials: 30, stimulusDurationMs: 800,  isiMs: 1000, timeLimit: 80 },
  4: { goRatio: 0.60, totalTrials: 35, stimulusDurationMs: 700,  isiMs: 800,  timeLimit: 90 },
  5: { goRatio: 0.50, totalTrials: 40, stimulusDurationMs: 500,  isiMs: 600,  timeLimit: 100 },
};

export function generate(
  level: number,
  seed: number,
): ExerciseContent<GoNoGoStimuli> {
  const params = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);

  const goCount = Math.round(params.totalTrials * params.goRatio);
  const noGoCount = params.totalTrials - goCount;

  const trialTypes = [
    ...Array(goCount).fill(true),
    ...Array(noGoCount).fill(false),
  ] as boolean[];

  // Shuffle
  for (let i = trialTypes.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = trialTypes[i] as boolean;
    trialTypes[i] = trialTypes[j] as boolean;
    trialTypes[j] = tmp;
  }

  const trials: GoNoGoTrial[] = trialTypes.map((isGo, id) => ({
    id,
    isGo,
    symbol: isGo ? GO : NO_GO,
    isiMs: params.isiMs + Math.floor(rng() * 400 - 200), // ±200ms jitter
  }));

  return {
    level,
    seed,
    timeLimit: params.timeLimit,
    stimuli: {
      trials,
      goSymbol: GO,
      noGoSymbol: NO_GO,
      stimulusDurationMs: params.stimulusDurationMs,
      timeLimit: params.timeLimit,
    },
  };
}

export function evaluate(
  stimuli: GoNoGoStimuli,
  response: GoNoGoResponse,
): TrialResult<GoNoGoStimuli, GoNoGoResponse> {
  const { hits, omissions, commissions } = computeMetrics(stimuli, response);
  const errors = omissions + commissions;
  const rts = response
    .filter((r) => r.responded && r.reactionTimeMs > 0)
    .map((r) => r.reactionTimeMs);
  const meanRt = rts.length > 0
    ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
    : 0;
  void hits;

  return {
    isCorrect: errors === 0,
    reactionTimeMs: meanRt,
    stimulus: stimuli,
    response,
  };
}

export function summarize(
  stimuli: GoNoGoStimuli,
  response: GoNoGoResponse,
): ExerciseSummary {
  const { hits, omissions, commissions } = computeMetrics(stimuli, response);
  const rts = response
    .filter((r) => r.responded && r.reactionTimeMs > 0)
    .map((r) => r.reactionTimeMs);
  const meanRt = rts.length > 0
    ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
    : null;

  return {
    hits,
    errors: omissions + commissions,
    reactionTimeMs: meanRt,
    rawData: { omissions, commissions, totalTrials: stimuli.trials.length },
  };
}

function computeMetrics(stimuli: GoNoGoStimuli, response: GoNoGoResponse) {
  const responseMap = new Map(response.map((r) => [r.trialId, r]));
  let hits = 0;
  let omissions = 0; // missed go
  let commissions = 0; // wrong no-go

  for (const trial of stimuli.trials) {
    const r = responseMap.get(trial.id);
    const responded = r?.responded ?? false;
    if (trial.isGo) {
      if (responded) hits++;
      else omissions++;
    } else {
      if (responded) commissions++;
    }
  }
  return { hits, omissions, commissions };
}
