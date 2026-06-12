import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface CancellationStimuli {
  gridSize: number;
  symbols: string[];
  targetSymbol: string;
  targetPositions: number[];
  timeLimit: number;
}

export interface CancellationTap {
  position: number;
  reactionTimeMs: number;
}

export type CancellationResponse = CancellationTap[];

const TARGET = '★';
const DISTRACTORS = ['○', '□', '△', '♦', '✦'];
const TARGET_DENSITY = 0.25;

interface LevelParams {
  gridSize: number;
  distractorCount: number;
  timeLimit: number;
}

const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { gridSize: 5,  distractorCount: 1, timeLimit: 60  },
  2: { gridSize: 7,  distractorCount: 2, timeLimit: 90  },
  3: { gridSize: 9,  distractorCount: 3, timeLimit: 120 },
  4: { gridSize: 10, distractorCount: 4, timeLimit: 150 },
  5: { gridSize: 12, distractorCount: 5, timeLimit: 180 },
};

export function generate(
  level: number,
  seed: number,
): ExerciseContent<CancellationStimuli> {
  const params = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const total = params.gridSize * params.gridSize;
  const available = DISTRACTORS.slice(0, params.distractorCount);

  const symbols: string[] = [];
  const targetPositions: number[] = [];

  for (let i = 0; i < total; i++) {
    if (rng() < TARGET_DENSITY) {
      symbols.push(TARGET);
      targetPositions.push(i);
    } else {
      const di = Math.floor(rng() * available.length);
      symbols.push(available[di] ?? '○');
    }
  }

  return {
    level,
    seed,
    timeLimit: params.timeLimit,
    stimuli: {
      gridSize: params.gridSize,
      symbols,
      targetSymbol: TARGET,
      targetPositions,
      timeLimit: params.timeLimit,
    },
  };
}

export function evaluate(
  stimuli: CancellationStimuli,
  response: CancellationResponse,
): TrialResult<CancellationStimuli, CancellationResponse> {
  const tapped = new Set(response.map((t) => t.position));
  const targets = new Set(stimuli.targetPositions);

  const hits = [...tapped].filter((p) => targets.has(p)).length;
  const omissions = stimuli.targetPositions.length - hits;
  const commissions = [...tapped].filter((p) => !targets.has(p)).length;

  const reactionTimeMs =
    response.length > 0 ? Math.max(...response.map((t) => t.reactionTimeMs)) : 0;

  return {
    isCorrect: omissions === 0 && commissions === 0,
    reactionTimeMs,
    stimulus: stimuli,
    response,
  };
}

export function summarize(
  stimuli: CancellationStimuli,
  response: CancellationResponse,
): ExerciseSummary {
  const tapped = new Set(response.map((t) => t.position));
  const targets = new Set(stimuli.targetPositions);

  const hits = [...tapped].filter((p) => targets.has(p)).length;
  const omissions = stimuli.targetPositions.length - hits;
  const commissions = [...tapped].filter((p) => !targets.has(p)).length;

  const reactionTimeMs =
    response.length > 0 ? Math.max(...response.map((t) => t.reactionTimeMs)) : null;

  return {
    hits,
    errors: omissions + commissions,
    reactionTimeMs,
    rawData: {
      omissions,
      commissions,
      totalTargets: stimuli.targetPositions.length,
      totalTaps: response.length,
    },
  };
}
