import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface CategorizationTrial {
  id: number;
  items: string[];       // 4 items, 3 belong to category, 1 is the odd-one-out
  oddIndex: number;      // which item doesn't belong
  categoryName: string;
}

export interface CategorizationStimuli {
  trials: CategorizationTrial[];
  timeLimit: number;
}

export interface CategorizationTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type CategorizationResponse = CategorizationTrialResponse[];

type CategorySet = { name: string; members: string[]; oddOnes: string[] };

const CATEGORIES: CategorySet[] = [
  { name: 'animales',    members: ['perro','gato','pájaro','pez','conejo'],    oddOnes: ['mesa','coche','libro'] },
  { name: 'frutas',      members: ['manzana','pera','naranja','uva','fresa'],  oddOnes: ['zanahoria','pollo','libro'] },
  { name: 'vehículos',   members: ['coche','tren','avión','barco','moto'],     oddOnes: ['silla','árbol','zapato'] },
  { name: 'colores',     members: ['rojo','azul','verde','amarillo','morado'], oddOnes: ['redondo','pesado','suave'] },
  { name: 'instrumentos',members: ['guitarra','piano','violín','flauta','batería'], oddOnes: ['pincel','llave','reloj'] },
  { name: 'herramientas',members: ['martillo','clavo','sierra','tornillo','llave'], oddOnes: ['tenedor','flor','lápiz'] },
  { name: 'ropa',        members: ['camisa','pantalón','zapato','sombrero','abrigo'], oddOnes: ['silla','manzana','viento'] },
  { name: 'emociones',   members: ['alegría','tristeza','miedo','ira','sorpresa'], oddOnes: ['mesa','correr','azul'] },
];

interface LevelParams { trials: number; fromCatIdx: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 6,  fromCatIdx: 0, timeLimit: 60 },
  2: { trials: 8,  fromCatIdx: 0, timeLimit: 70 },
  3: { trials: 8,  fromCatIdx: 3, timeLimit: 70 },
  4: { trials: 10, fromCatIdx: 4, timeLimit: 80 },
  5: { trials: 10, fromCatIdx: 5, timeLimit: 80 },
};

export function generate(level: number, seed: number): ExerciseContent<CategorizationStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const cats = CATEGORIES.slice(p.fromCatIdx);
  const trials: CategorizationTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const cat = cats[id % cats.length] as CategorySet;
    const members = [...cat.members];
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = members[i] as string; members[i] = members[j] as string; members[j] = tmp;
    }
    const threeMembers = members.slice(0, 3);
    const odd = cat.oddOnes[Math.floor(rng() * cat.oddOnes.length)] as string;
    const oddIndex = Math.floor(rng() * 4);
    const items = [...threeMembers.slice(0, oddIndex), odd, ...threeMembers.slice(oddIndex)];
    return { id, items, oddIndex, categoryName: cat.name };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, timeLimit: p.timeLimit } };
}

export function evaluate(s: CategorizationStimuli, r: CategorizationResponse): TrialResult<CategorizationStimuli, CategorizationResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: CategorizationStimuli, r: CategorizationResponse): ExerciseSummary {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt, rawData: { totalTrials: s.trials.length } };
}

function computeMetrics(s: CategorizationStimuli, r: CategorizationResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, errors = 0;
  const rts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    if (resp?.chosenIndex === t.oddIndex) { hits++; rts.push(resp.reactionTimeMs); }
    else errors++;
  }
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { hits, errors, meanRt };
}
