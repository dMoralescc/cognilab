import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface RecognitionItem {
  id: number;
  emoji: string;
  category: string;
  isTarget: boolean;
}

export interface VisualRecognitionStimuli {
  studyItems: RecognitionItem[];
  testItems: RecognitionItem[];
  studyTimeMs: number;
  timeLimit: number;
}

export type VisualRecognitionResponse = number[];  // ids user identified as "seen"

const ITEM_POOLS: Record<string, string[]> = {
  animals:   ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🦁','🐯','🐮','🐷','🐸'],
  food:      ['🍎','🍊','🍋','🍇','🍓','🥕','🍕','🍔','🌮','🍜','🍣','🥐'],
  objects:   ['📚','✂️','🔑','🎸','⚽','🎭','🎨','🔭','🎯','🎲','🏆','🎀'],
  transport: ['🚗','✈️','🚂','🚢','🚲','🛵','🚌','🚀','🛸','⛵','🚁','🏍️'],
};

interface LevelParams { itemCount: number; distractors: number; categories: string[]; studyMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { itemCount: 8,  distractors: 4,  categories: ['animals'],            studyMs: 6000, timeLimit: 70 },
  2: { itemCount: 10, distractors: 6,  categories: ['animals','food'],     studyMs: 5000, timeLimit: 90 },
  3: { itemCount: 12, distractors: 8,  categories: ['food','objects'],     studyMs: 4000, timeLimit: 100 },
  4: { itemCount: 16, distractors: 10, categories: ['objects','transport'],studyMs: 3000, timeLimit: 120 },
  5: { itemCount: 20, distractors: 12, categories: ['transport','animals'],studyMs: 2500, timeLimit: 140 },
};

export function generate(level: number, seed: number): ExerciseContent<VisualRecognitionStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const pool: RecognitionItem[] = [];
  for (const cat of p.categories) {
    const items = [...(ITEM_POOLS[cat] ?? [])];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = items[i] as string; items[i] = items[j] as string; items[j] = tmp;
    }
    items.slice(0, 6).forEach((emoji) => pool.push({ id: pool.length, emoji, category: cat, isTarget: false }));
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i] as RecognitionItem; pool[i] = pool[j] as RecognitionItem; pool[j] = tmp;
  }
  const studyItems = pool.slice(0, p.itemCount).map((it) => ({ ...it, isTarget: true }));
  const distractors = pool.slice(p.itemCount, p.itemCount + p.distractors);
  const testItems = [...studyItems, ...distractors];
  for (let i = testItems.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = testItems[i] as RecognitionItem; testItems[i] = testItems[j] as RecognitionItem; testItems[j] = tmp;
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    studyItems, testItems, studyTimeMs: p.studyMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: VisualRecognitionStimuli, r: VisualRecognitionResponse): TrialResult<VisualRecognitionStimuli, VisualRecognitionResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: VisualRecognitionStimuli, r: VisualRecognitionResponse): ExerciseSummary {
  const { hits, errors, falseAlarms, omissions } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { falseAlarms, omissions, targetCount: s.studyItems.length } };
}

function computeMetrics(s: VisualRecognitionStimuli, r: VisualRecognitionResponse) {
  const targets = new Set(s.studyItems.map((it) => it.id));
  const selected = new Set(r);
  const hits = [...selected].filter((id) => targets.has(id)).length;
  const falseAlarms = [...selected].filter((id) => !targets.has(id)).length;
  const omissions = targets.size - hits;
  return { hits, errors: falseAlarms + omissions, falseAlarms, omissions };
}
