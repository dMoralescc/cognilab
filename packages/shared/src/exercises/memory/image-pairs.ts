import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface ImagePair {
  id: number;
  leftEmoji: string;
  rightEmoji: string;
}

export interface ImagePairsStimuli {
  pairs: ImagePair[];
  exposureTimeMs: number;
  delayTimeMs: number;
  timeLimit: number;
}

// Response: for each pair id, what emoji the user selected as the match for leftEmoji
export type ImagePairsResponse = Array<{ pairId: number; chosen: string }>;

const EMOJI_POOL = [
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🦁','🐯',
  '🐮','🐷','🐸','🐙','🦋','🌸','🌺','🌈','⭐','🎈',
  '🍎','🍊','🍋','🍇','🍓','🚀','⚽','🎸','🎹','🏆',
];

interface LevelParams { pairCount: number; exposureMs: number; delayMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { pairCount: 4,  exposureMs: 5000, delayMs: 2000,  timeLimit: 60 },
  2: { pairCount: 6,  exposureMs: 4000, delayMs: 3000,  timeLimit: 75 },
  3: { pairCount: 8,  exposureMs: 3000, delayMs: 4000,  timeLimit: 90 },
  4: { pairCount: 10, exposureMs: 2000, delayMs: 5000,  timeLimit: 110 },
  5: { pairCount: 12, exposureMs: 2000, delayMs: 6000,  timeLimit: 130 },
};

export function generate(level: number, seed: number): ExerciseContent<ImagePairsStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const pool = [...EMOJI_POOL];
  // Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i] as string; pool[i] = pool[j] as string; pool[j] = tmp;
  }
  const needed = p.pairCount * 2;
  const selected = pool.slice(0, needed);
  const pairs: ImagePair[] = Array.from({ length: p.pairCount }, (_, id) => ({
    id,
    leftEmoji: selected[id * 2] as string,
    rightEmoji: selected[id * 2 + 1] as string,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    pairs, exposureTimeMs: p.exposureMs, delayTimeMs: p.delayMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: ImagePairsStimuli, r: ImagePairsResponse): TrialResult<ImagePairsStimuli, ImagePairsResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: ImagePairsStimuli, r: ImagePairsResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { pairCount: s.pairs.length } };
}

function computeMetrics(s: ImagePairsStimuli, r: ImagePairsResponse) {
  const pairMap = new Map(s.pairs.map((p) => [p.id, p.rightEmoji]));
  const respMap = new Map(r.map((x) => [x.pairId, x.chosen]));
  let hits = 0, errors = 0;
  for (const pair of s.pairs) {
    if (respMap.get(pair.id) === pairMap.get(pair.id)) hits++;
    else errors++;
  }
  return { hits, errors };
}
