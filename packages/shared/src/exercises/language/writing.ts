import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type WritingTaskType = 'dictation' | 'copy';

export interface WritingItem {
  id: number;
  text: string;
  taskType: WritingTaskType;
}

export interface WritingStimuli {
  items: WritingItem[];
  displayMs: number;
  timePerItem: number;
}

export interface WritingTrialResponse {
  itemId: number;
  typed: string;
  reactionTimeMs: number;
}

export type WritingResponse = WritingTrialResponse[];

const SIMPLE_WORDS = ['sol', 'mar', 'pan', 'luz', 'flor', 'gato', 'mesa', 'casa', 'cielo', 'libro'];
const MEDIUM_WORDS = ['zapato', 'ventana', 'espejo', 'cuchara', 'lámpara', 'alfombra', 'paraguas', 'murciélago'];
const COMPLEX_SENTENCES = [
  'El médico recetó antibióticos.',
  'Mañana tenemos una reunión importante.',
  'La biblioteca cierra a las nueve de la noche.',
  'Compramos frutas y verduras en el mercado.',
];
const COMPLEX_SENTENCES_HARD = [
  'Las obras de rehabilitación comenzarán en otoño.',
  'El científico publicó sus resultados en una revista especializada.',
  'Aunque llovía, decidieron salir a caminar por el parque.',
];

interface LevelParams { items: string[]; taskType: WritingTaskType; count: number; displayMs: number; timePerItem: number }
const LEVELS: LevelParams[] = [
  { items: SIMPLE_WORDS,          taskType: 'dictation', count: 6,  displayMs: 2000, timePerItem: 6000  },
  { items: MEDIUM_WORDS,          taskType: 'dictation', count: 6,  displayMs: 2000, timePerItem: 8000  },
  { items: [...SIMPLE_WORDS, ...MEDIUM_WORDS], taskType: 'copy', count: 6, displayMs: 3000, timePerItem: 8000 },
  { items: COMPLEX_SENTENCES,     taskType: 'dictation', count: 4,  displayMs: 3000, timePerItem: 15000 },
  { items: COMPLEX_SENTENCES_HARD, taskType: 'dictation', count: 4, displayMs: 3000, timePerItem: 18000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<WritingStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const selected = shuffle(p.items, rng).slice(0, p.count);
  const items: WritingItem[] = selected.map((text, idx) => ({ id: idx, text, taskType: p.taskType }));
  return { level, seed, timeLimit: Math.ceil((items.length * (p.displayMs + p.timePerItem)) / 1000), stimuli: { items, displayMs: p.displayMs, timePerItem: p.timePerItem } };
}

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '');
}

export function summarize(stimuli: WritingStimuli, response: WritingResponse): ExerciseSummary {
  const textMap = new Map(stimuli.items.map(it => [it.id, it.text]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    const correct = textMap.get(r.itemId) ?? '';
    if (normalize(r.typed) === normalize(correct)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: { total: response.length } };
}
