import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface NamingItem {
  id: number;
  emoji: string;
  correctName: string;
  options: string[];  // 4 options including correctName
}

export interface NamingStimuli {
  items: NamingItem[];
  timePerItem: number;  // ms
}

export interface NamingTrialResponse {
  itemId: number;
  response: string;
  reactionTimeMs: number;
}

export type NamingResponse = NamingTrialResponse[];

// frequency: 1=high, 5=low
const ITEM_BANK: { emoji: string; name: string; frequency: number }[] = [
  { emoji: '🍎', name: 'manzana', frequency: 1 },
  { emoji: '🐶', name: 'perro', frequency: 1 },
  { emoji: '🚗', name: 'coche', frequency: 1 },
  { emoji: '🌳', name: 'árbol', frequency: 1 },
  { emoji: '📚', name: 'libro', frequency: 1 },
  { emoji: '⌚', name: 'reloj', frequency: 1 },
  { emoji: '✂️', name: 'tijeras', frequency: 2 },
  { emoji: '🔑', name: 'llave', frequency: 2 },
  { emoji: '💡', name: 'bombilla', frequency: 2 },
  { emoji: '🌂', name: 'paraguas', frequency: 2 },
  { emoji: '🔭', name: 'telescopio', frequency: 3 },
  { emoji: '🧲', name: 'imán', frequency: 3 },
  { emoji: '⚗️', name: 'matraz', frequency: 3 },
  { emoji: '🎻', name: 'violín', frequency: 3 },
  { emoji: '🦒', name: 'jirafa', frequency: 4 },
  { emoji: '🌵', name: 'cactus', frequency: 4 },
  { emoji: '🦭', name: 'foca', frequency: 4 },
  { emoji: '🪃', name: 'bumerán', frequency: 5 },
  { emoji: '🧭', name: 'brújula', frequency: 5 },
  { emoji: '🪬', name: 'amuleto', frequency: 5 },
];

interface LevelParams { count: number; maxFrequency: number; timePerItem: number }
const LEVELS: LevelParams[] = [
  { count: 5,  maxFrequency: 1, timePerItem: 8000 },
  { count: 8,  maxFrequency: 2, timePerItem: 7000 },
  { count: 10, maxFrequency: 3, timePerItem: 6000 },
  { count: 12, maxFrequency: 4, timePerItem: 5000 },
  { count: 15, maxFrequency: 5, timePerItem: 4000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<NamingStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const eligible = ITEM_BANK.filter(it => it.frequency <= p.maxFrequency);
  const selected = shuffle(eligible, rng).slice(0, p.count);
  const allNames = ITEM_BANK.map(it => it.name);
  const items: NamingItem[] = selected.map((it, idx) => {
    const distractors = shuffle(allNames.filter(n => n !== it.name), rng).slice(0, 3);
    const options = shuffle([it.name, ...distractors], rng);
    return { id: idx, emoji: it.emoji, correctName: it.name, options };
  });
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerItem) / 1000), stimuli: { items, timePerItem: p.timePerItem } };
}

export function summarize(stimuli: NamingStimuli, response: NamingResponse): ExerciseSummary {
  const itemMap = new Map(stimuli.items.map(it => [it.id, it.correctName]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.response === itemMap.get(r.itemId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
