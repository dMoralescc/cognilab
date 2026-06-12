import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface AssemblyPart {
  id: number;
  emoji: string;
  label: string;
  rotation: number;  // degrees, for higher levels
}

export interface AssemblyItem {
  id: number;
  targetEmoji: string;
  targetName: string;
  parts: AssemblyPart[];
  correctOrderIds: number[];
}

export interface ObjectAssemblyStimuli {
  items: AssemblyItem[];
  timePerItem: number;
}

export interface AssemblyTrialResponse {
  itemId: number;
  identified: boolean;  // did user identify the object
  reactionTimeMs: number;
}

export type ObjectAssemblyResponse = AssemblyTrialResponse[];

const ASSEMBLY_BANK = [
  { target: '🏠', name: 'Casa', parts: ['🔺', '🟦', '🚪'], level: 1 },
  { target: '🐶', name: 'Perro', parts: ['⬛', '🔵', '⬛', '⬛'], level: 1 },
  { target: '🚗', name: 'Coche', parts: ['🟦', '⭕', '⭕'], level: 2 },
  { target: '🌳', name: 'Árbol', parts: ['🟫', '🟢', '🟢'], level: 2 },
  { target: '✈️', name: 'Avión', parts: ['▶️', '◀️', '⬆️', '⬇️'], level: 3 },
  { target: '🎸', name: 'Guitarra', parts: ['🔸', '🔷', '〰️', '🔘'], level: 3 },
  { target: '🔬', name: 'Microscopio', parts: ['⬛', '⚫', '🔲', '🔘'], level: 4 },
  { target: '🎪', name: 'Carpa', parts: ['🔴', '🟡', '🔵', '🟢', '⬛'], level: 4 },
];

interface LevelParams { count: number; maxLevel: number; rotation: boolean; timePerItem: number }
const LEVELS: LevelParams[] = [
  { count: 3, maxLevel: 1, rotation: false, timePerItem: 8000  },
  { count: 4, maxLevel: 2, rotation: false, timePerItem: 10000 },
  { count: 4, maxLevel: 3, rotation: false, timePerItem: 12000 },
  { count: 5, maxLevel: 4, rotation: true,  timePerItem: 14000 },
  { count: 5, maxLevel: 4, rotation: true,  timePerItem: 16000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<ObjectAssemblyStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const eligible = ASSEMBLY_BANK.filter(b => b.level <= p.maxLevel);
  const selected = shuffle(eligible, rng).slice(0, p.count);
  const rotations = [0, 90, 180, 270];
  const items: AssemblyItem[] = selected.map((src, id) => {
    const parts: AssemblyPart[] = src.parts.map((emoji, pid) => ({
      id: pid,
      emoji,
      label: `Pieza ${pid + 1}`,
      rotation: p.rotation ? (rotations[Math.floor(rng() * 4)] as number) : 0,
    }));
    const shuffledParts = shuffle(parts, rng);
    return { id, targetEmoji: src.target, targetName: src.name, parts: shuffledParts, correctOrderIds: src.parts.map((_, i) => i) };
  });
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerItem) / 1000), stimuli: { items, timePerItem: p.timePerItem } };
}

export function summarize(_stimuli: ObjectAssemblyStimuli, response: ObjectAssemblyResponse): ExerciseSummary {
  const hits = response.filter(r => r.identified).length;
  const errors = response.length - hits;
  const totalRt = response.reduce((s, r) => s + r.reactionTimeMs, 0);
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
