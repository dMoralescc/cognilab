import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Corsi Block equivalent: blocks light up in sequence; user taps them in same order
export interface VisuospatialSpanStimuli {
  blocks: Array<{ id: number; x: number; y: number }>;  // fixed block positions
  sequence: number[];  // block ids in order
  speedMs: number;     // ms per block highlight
  timeLimit: number;
}

export type VisuospatialSpanResponse = number[];  // block ids in user's order

interface LevelParams { blockCount: number; sequenceLength: number; speedMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { blockCount: 5, sequenceLength: 3, speedMs: 900,  timeLimit: 30 },
  2: { blockCount: 6, sequenceLength: 4, speedMs: 800,  timeLimit: 35 },
  3: { blockCount: 7, sequenceLength: 5, speedMs: 700,  timeLimit: 40 },
  4: { blockCount: 8, sequenceLength: 6, speedMs: 600,  timeLimit: 45 },
  5: { blockCount: 9, sequenceLength: 7, speedMs: 500,  timeLimit: 50 },
};

// Fixed-ish Corsi-like grid positions (normalized 0-1)
const BLOCK_POSITIONS = [
  { x: 0.15, y: 0.25 }, { x: 0.35, y: 0.15 }, { x: 0.55, y: 0.30 }, { x: 0.75, y: 0.20 },
  { x: 0.20, y: 0.55 }, { x: 0.45, y: 0.50 }, { x: 0.70, y: 0.55 }, { x: 0.30, y: 0.75 },
  { x: 0.60, y: 0.80 },
];

export function generate(level: number, seed: number): ExerciseContent<VisuospatialSpanStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const blocks = BLOCK_POSITIONS.slice(0, p.blockCount).map((pos, id) => ({ id, ...pos }));
  const sequence = Array.from({ length: p.sequenceLength }, () => Math.floor(rng() * p.blockCount));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    blocks, sequence, speedMs: p.speedMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: VisuospatialSpanStimuli, r: VisuospatialSpanResponse): TrialResult<VisuospatialSpanStimuli, VisuospatialSpanResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: VisuospatialSpanStimuli, r: VisuospatialSpanResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { sequenceLength: s.sequence.length } };
}

function computeMetrics(s: VisuospatialSpanStimuli, r: VisuospatialSpanResponse) {
  let hits = 0, errors = 0;
  for (let i = 0; i < s.sequence.length; i++) {
    if (r[i] === s.sequence[i]) hits++;
    else errors++;
  }
  return { hits, errors };
}
