import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface ShapeTrial {
  id: number;
  target: string;
  options: string[];   // 4 options, one matches target
  correctIndex: number;
}

export interface ShapeDiscriminationStimuli {
  trials: ShapeTrial[];
  timePerTrial: number;
}

export interface ShapeTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type ShapeDiscriminationResponse = ShapeTrialResponse[];

// Shape groups: similar shapes for higher levels
const SHAPE_SETS: string[][] = [
  ['●', '■', '▲', '★', '◆', '✚'],           // basic, very different
  ['◉', '◎', '○', '●', '⊙', '⊕'],           // circles
  ['▲', '△', '▽', '▴', '▾', '◁'],           // triangles
  ['■', '□', '▪', '▫', '▬', '▭'],           // rectangles
  ['★', '☆', '✦', '✧', '✩', '✫'],           // stars
];

interface LevelParams { trials: number; setIdx: number; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { trials: 8,  setIdx: 0, timePerTrial: 4000 },
  { trials: 10, setIdx: 1, timePerTrial: 3500 },
  { trials: 12, setIdx: 2, timePerTrial: 3000 },
  { trials: 14, setIdx: 3, timePerTrial: 2500 },
  { trials: 16, setIdx: 4, timePerTrial: 2000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<ShapeDiscriminationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const shapes = SHAPE_SETS[p.setIdx] ?? SHAPE_SETS[0]!;
  const trials: ShapeTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const target = shapes[Math.floor(rng() * shapes.length)] as string;
    const distractors = shuffle(shapes.filter(s => s !== target), rng).slice(0, 3);
    const options = shuffle([target, ...distractors], rng);
    const correctIndex = options.indexOf(target);
    return { id, target, options, correctIndex };
  });
  return { level, seed, timeLimit: Math.ceil((p.trials * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: ShapeDiscriminationStimuli, response: ShapeDiscriminationResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.trials.map(t => [t.id, t.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === correctMap.get(r.trialId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
