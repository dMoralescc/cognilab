import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Matrix reasoning: 3x3 grid, find the missing element
export interface MatrixItem {
  shape: 'circle' | 'square' | 'triangle';
  fill: 'empty' | 'half' | 'full';
  size: 'small' | 'medium' | 'large';
}

export interface AbstractReasoningTrial {
  id: number;
  matrix: Array<MatrixItem | null>;  // 9 cells, last is null (to find)
  options: MatrixItem[];             // 4 options, one is correct
  correctIndex: number;
}

export interface AbstractReasoningStimuli {
  trials: AbstractReasoningTrial[];
  timeLimit: number;
}

export interface AbstractReasoningTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type AbstractReasoningResponse = AbstractReasoningTrialResponse[];

const SHAPES: MatrixItem['shape'][] = ['circle', 'square', 'triangle'];
const FILLS: MatrixItem['fill'][] = ['empty', 'half', 'full'];
const SIZES: MatrixItem['size'][] = ['small', 'medium', 'large'];

interface LevelParams { trials: number; ruleCount: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 6,  ruleCount: 1, timeLimit: 90 },
  2: { trials: 8,  ruleCount: 1, timeLimit: 90 },
  3: { trials: 8,  ruleCount: 2, timeLimit: 100 },
  4: { trials: 10, ruleCount: 2, timeLimit: 100 },
  5: { trials: 10, ruleCount: 3, timeLimit: 110 },
};

// Generate matrix: each row cycles through all values of active rule dimensions
function generateMatrix(ruleCount: number, rng: () => number): { matrix: MatrixItem[]; answer: MatrixItem } {
  const dims: Array<keyof MatrixItem> = (['shape','fill','size'] as Array<keyof MatrixItem>).slice(0, ruleCount);
  const baseShape = SHAPES[Math.floor(rng() * 3)] as MatrixItem['shape'];
  const baseFill  = FILLS[Math.floor(rng() * 3)] as MatrixItem['fill'];
  const baseSize  = SIZES[Math.floor(rng() * 3)] as MatrixItem['size'];
  const matrix: MatrixItem[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let shape = baseShape, fill = baseFill, size = baseSize;
      if (dims.includes('shape')) shape = SHAPES[(SHAPES.indexOf(baseShape) + col) % 3] as MatrixItem['shape'];
      if (dims.includes('fill'))  fill  = FILLS[(FILLS.indexOf(baseFill) + col) % 3] as MatrixItem['fill'];
      if (dims.includes('size'))  size  = SIZES[(SIZES.indexOf(baseSize) + row) % 3] as MatrixItem['size'];
      matrix.push({ shape, fill, size });
    }
  }
  return { matrix, answer: matrix[8]! };
}

export function generate(level: number, seed: number): ExerciseContent<AbstractReasoningStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const trials: AbstractReasoningTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const { matrix, answer } = generateMatrix(p.ruleCount, rng);
    const visible: Array<MatrixItem | null> = [...matrix];
    visible[8] = null;
    // Generate 3 distractors
    const distractors: MatrixItem[] = Array.from({ length: 3 }, () => ({
      shape: SHAPES[Math.floor(rng() * 3)] as MatrixItem['shape'],
      fill: FILLS[Math.floor(rng() * 3)] as MatrixItem['fill'],
      size: SIZES[Math.floor(rng() * 3)] as MatrixItem['size'],
    }));
    const correctIndex = Math.floor(rng() * 4);
    const options = [...distractors.slice(0, correctIndex), answer, ...distractors.slice(correctIndex)];
    return { id, matrix: visible, options, correctIndex };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, timeLimit: p.timeLimit } };
}

export function evaluate(s: AbstractReasoningStimuli, r: AbstractReasoningResponse): TrialResult<AbstractReasoningStimuli, AbstractReasoningResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: AbstractReasoningStimuli, r: AbstractReasoningResponse): ExerciseSummary {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt, rawData: { totalTrials: s.trials.length } };
}

function computeMetrics(s: AbstractReasoningStimuli, r: AbstractReasoningResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, errors = 0;
  const rts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    if (resp?.chosenIndex === t.correctIndex) { hits++; rts.push(resp.reactionTimeMs); }
    else errors++;
  }
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { hits, errors, meanRt };
}
