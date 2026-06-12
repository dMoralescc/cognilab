import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type StimulusType = 'word' | 'pseudoword' | 'sentence';

export interface RepetitionItem {
  id: number;
  text: string;
  type: StimulusType;
}

export interface RepetitionStimuli {
  items: RepetitionItem[];
  displayMs: number;   // how long to show item before hiding
  timePerItem: number; // ms to respond
}

export interface RepetitionTrialResponse {
  itemId: number;
  typed: string;
  reactionTimeMs: number;
}

export type RepetitionResponse = RepetitionTrialResponse[];

const WORDS_FREQ: string[] = ['casa', 'mesa', 'gato', 'sol', 'mar', 'pan', 'luz', 'flor', 'aire', 'agua'];
const WORDS_INFREQ: string[] = ['brújula', 'murciélago', 'paraguas', 'almohada', 'espectáculo', 'lámpara', 'ventana', 'máquina'];
const PSEUDOWORDS_2: string[] = ['plato', 'brano', 'cufis', 'telmo', 'zupra'];
const PSEUDOWORDS_5: string[] = ['flemotari', 'cruspelino', 'davorquín', 'brelstompa', 'zaprofunde'];
const SENTENCES_SHORT: string[] = [
  'El perro corre por el parque.',
  'Ana come una manzana roja.',
  'El niño lee un libro.',
];
const SENTENCES_LONG: string[] = [
  'El médico que vino ayer me recetó antibióticos.',
  'Después de cenar, Juan salió a dar un paseo por el barrio.',
  'La reunión que habían organizado para el martes se canceló por la lluvia.',
];

interface LevelParams { items: string[]; type: StimulusType; count: number; displayMs: number; timePerItem: number }
const LEVELS: LevelParams[] = [
  { items: WORDS_FREQ,    type: 'word',       count: 6,  displayMs: 2000, timePerItem: 5000  },
  { items: WORDS_INFREQ,  type: 'word',       count: 6,  displayMs: 1500, timePerItem: 6000  },
  { items: PSEUDOWORDS_2, type: 'pseudoword', count: 5,  displayMs: 2000, timePerItem: 7000  },
  { items: SENTENCES_SHORT, type: 'sentence', count: 3,  displayMs: 3000, timePerItem: 10000 },
  { items: [...SENTENCES_LONG, ...PSEUDOWORDS_5], type: 'sentence', count: 5, displayMs: 3000, timePerItem: 12000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<RepetitionStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const selected = shuffle(p.items, rng).slice(0, p.count);
  const items: RepetitionItem[] = selected.map((text, idx) => ({ id: idx, text, type: p.type }));
  return { level, seed, timeLimit: Math.ceil((items.length * (p.displayMs + p.timePerItem)) / 1000), stimuli: { items, displayMs: p.displayMs, timePerItem: p.timePerItem } };
}

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '');
}

export function summarize(stimuli: RepetitionStimuli, response: RepetitionResponse): ExerciseSummary {
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
