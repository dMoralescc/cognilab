import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type PerspectiveType = 'visual' | 'cognitive';

export interface PerspectiveTrial {
  id: number;
  type: PerspectiveType;
  description: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PerspectiveTakingStimuli {
  trials: PerspectiveTrial[];
  timePerTrial: number;
}

export interface PerspectiveTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type PerspectiveTakingResponse = PerspectiveTrialResponse[];

const TRIAL_BANK: Omit<PerspectiveTrial, 'id'>[] = [
  // Visual level 1
  { type: 'visual', description: 'María y Tomás están sentados uno frente al otro. Entre ellos hay una taza. El asa de la taza apunta hacia María.',
    question: '¿Hacia quién apunta el asa de la taza desde la perspectiva de Tomás?',
    options: ['Hacia Tomás', 'Hacia María', 'Hacia la derecha', 'No se puede saber'],
    correctIndex: 1 },
  { type: 'visual', description: 'Ana mira un reloj de pared. Las agujas marcan las 3 en punto desde el frente. Carlos está detrás del reloj.',
    question: '¿Qué hora ve Carlos en el reloj (mirando desde detrás)?',
    options: ['Las 3 en punto igual', 'Algo diferente debido a la posición', 'No puede ver el reloj', 'Las 9 en punto'],
    correctIndex: 1 },
  // Visual level 2
  { type: 'visual', description: 'En una mesa hay un libro con la cubierta de colores hacia arriba. Luis está de pie mirando la mesa y ve la portada. Elena está frente a Luis.',
    question: '¿Qué ve Elena de la portada del libro?',
    options: ['La misma vista que Luis', 'La contraportada o la vista invertida', 'No ve el libro', 'Solo el lomo'],
    correctIndex: 1 },
  { type: 'visual', description: 'En un parque, un árbol está a la izquierda de Pablo. Sara está de frente a Pablo.',
    question: '¿En qué lado está el árbol para Sara?',
    options: ['A la izquierda de Sara también', 'A la derecha de Sara', 'Detrás de Sara', 'No puede verlo'],
    correctIndex: 1 },
  // Cognitive
  { type: 'cognitive', description: 'Julia lleva trabajando en un proyecto secreto 3 meses. Su jefe no sabe nada del proyecto.',
    question: '¿Qué sabe el jefe de Julia sobre el proyecto?',
    options: ['Lo sabe todo', 'Nada, ya que es secreto', 'Lo descubrió por otros medios', 'Algo, pero no los detalles'],
    correctIndex: 1 },
  { type: 'cognitive', description: 'Un niño esconde un juguete en su cuarto. Su madre nunca ha entrado al cuarto ese día.',
    question: '¿Dónde cree la madre que está el juguete?',
    options: ['Donde el niño lo escondió', 'No lo sabe, no entró al cuarto', 'En el salón', 'Lo perdió'],
    correctIndex: 1 },
  { type: 'cognitive', description: 'Pedro vio ayer una película que todavía no ha estrenado en España. Su amiga Carmen no la ha visto.',
    question: '¿Qué sabe Carmen sobre el final de la película?',
    options: ['Lo mismo que Pedro', 'Nada, no la ha visto', 'Lo leyó en internet', 'Lo mismo que todo el mundo'],
    correctIndex: 1 },
  // Complex cognitive
  { type: 'cognitive', description: 'Rosa cree que Miguel piensa que ella está enojada con él, aunque en realidad Rosa está tranquila.',
    question: '¿Qué cree Rosa que piensa Miguel?',
    options: ['Que Rosa está enojada con él', 'Que Rosa está tranquila', 'Que Rosa no piensa en él', 'Que Rosa está triste'],
    correctIndex: 0 },
];

interface LevelParams { count: number; types: PerspectiveType[]; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { count: 3, types: ['visual'],             timePerTrial: 12000 },
  { count: 4, types: ['visual'],             timePerTrial: 12000 },
  { count: 4, types: ['visual', 'cognitive'], timePerTrial: 14000 },
  { count: 5, types: ['visual', 'cognitive'], timePerTrial: 14000 },
  { count: 6, types: ['visual', 'cognitive'], timePerTrial: 16000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<PerspectiveTakingStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const eligible = TRIAL_BANK.filter(t => p.types.includes(t.type));
  const selected = shuffle(eligible, rng).slice(0, p.count);
  const trials: PerspectiveTrial[] = selected.map((t, idx) => ({ id: idx, ...t }));
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: PerspectiveTakingStimuli, response: PerspectiveTakingResponse): ExerciseSummary {
  const map = new Map(stimuli.trials.map(t => [t.id, t.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.trialId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
