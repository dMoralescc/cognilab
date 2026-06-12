import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface DepthItem {
  id: number;
  objects: { emoji: string; size: number; opacity: number; zIndex: number }[];  // sorted by apparent distance
  question: string;
  correctOrder: number[];  // indices from nearest to farthest
}

export interface DepthPerceptionStimuli {
  items: DepthItem[];
  timePerItem: number;
}

export interface DepthTrialResponse {
  itemId: number;
  chosenOrder: number[];
  reactionTimeMs: number;
}

export type DepthPerceptionResponse = DepthTrialResponse[];

const OBJECTS = ['🏠', '🌲', '🚗', '🐄', '⛰️', '🌻', '🏔️', '🦅'];

interface LevelParams { itemCount: number; objectsPerItem: number; sizeVariation: number; timePerItem: number }
const LEVELS: LevelParams[] = [
  { itemCount: 4,  objectsPerItem: 2, sizeVariation: 0.6, timePerItem: 6000  },
  { itemCount: 5,  objectsPerItem: 3, sizeVariation: 0.5, timePerItem: 7000  },
  { itemCount: 6,  objectsPerItem: 3, sizeVariation: 0.4, timePerItem: 8000  },
  { itemCount: 7,  objectsPerItem: 4, sizeVariation: 0.3, timePerItem: 9000  },
  { itemCount: 8,  objectsPerItem: 4, sizeVariation: 0.2, timePerItem: 10000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<DepthPerceptionStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const items: DepthItem[] = Array.from({ length: p.itemCount }, (_, id) => {
    const objs = shuffle(OBJECTS, rng).slice(0, p.objectsPerItem);
    // zIndex 0 = farthest, high = nearest; size varies accordingly
    const orderedObjs = objs.map((emoji, zIndex) => ({
      emoji,
      size: 1.0 + (zIndex * p.sizeVariation),  // nearer = larger
      opacity: 0.5 + (zIndex * (0.5 / p.objectsPerItem)),
      zIndex,
    }));
    const shuffledObjs = shuffle(orderedObjs, rng);
    const correctOrder = shuffledObjs.map((o) => o.zIndex).sort((a, b) => b - a); // nearest first = highest zIndex first
    return {
      id,
      objects: shuffledObjs,
      question: `¿En qué orden están los objetos de más cercano a más lejano?`,
      correctOrder,
    };
  });
  return { level, seed, timeLimit: Math.ceil((p.itemCount * p.timePerItem) / 1000), stimuli: { items, timePerItem: p.timePerItem } };
}

export function summarize(stimuli: DepthPerceptionStimuli, response: DepthPerceptionResponse): ExerciseSummary {
  const orderMap = new Map(stimuli.items.map(it => [it.id, it.correctOrder]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    const correct = orderMap.get(r.itemId) ?? [];
    const isCorrect = correct.length === r.chosenOrder.length && correct.every((v, i) => v === r.chosenOrder[i]);
    if (isCorrect) hits++; else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
