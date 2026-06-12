import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface AttentionSpanStimuli {
  targetPositions: number[]; // indices that lit up
  gridSize: number;
  exposureTimeMs: number;
  timeLimit: number;
}

export type AttentionSpanResponse = number[]; // indices user selected

interface LevelParams { spanSize: number; gridSize: number; exposureTimeMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { spanSize: 3, gridSize: 4, exposureTimeMs: 2000, timeLimit: 30 },
  2: { spanSize: 4, gridSize: 4, exposureTimeMs: 1500, timeLimit: 35 },
  3: { spanSize: 5, gridSize: 5, exposureTimeMs: 1200, timeLimit: 40 },
  4: { spanSize: 6, gridSize: 5, exposureTimeMs: 800,  timeLimit: 45 },
  5: { spanSize: 8, gridSize: 5, exposureTimeMs: 500,  timeLimit: 50 },
};

export function generate(level: number, seed: number): ExerciseContent<AttentionSpanStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const total = p.gridSize * p.gridSize;
  const positions = Array.from({ length: total }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = positions[i] as number; positions[i] = positions[j] as number; positions[j] = tmp;
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    targetPositions: positions.slice(0, p.spanSize),
    gridSize: p.gridSize,
    exposureTimeMs: p.exposureTimeMs,
    timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: AttentionSpanStimuli, r: AttentionSpanResponse): TrialResult<AttentionSpanStimuli, AttentionSpanResponse> {
  const target = new Set(s.targetPositions);
  const resp = new Set(r);
  const hits = [...resp].filter((p) => target.has(p)).length;
  const errors = [...resp].filter((p) => !target.has(p)).length + (s.targetPositions.length - hits);
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: AttentionSpanStimuli, r: AttentionSpanResponse): ExerciseSummary {
  const target = new Set(s.targetPositions);
  const resp = new Set(r);
  const hits = [...resp].filter((p) => target.has(p)).length;
  const commissions = [...resp].filter((p) => !target.has(p)).length;
  const omissions = s.targetPositions.length - hits;
  return { hits, errors: omissions + commissions, reactionTimeMs: null,
    rawData: { omissions, commissions, spanSize: s.targetPositions.length } };
}
