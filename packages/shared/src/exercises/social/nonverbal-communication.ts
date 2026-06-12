import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type GestureType = 'universal' | 'facial' | 'postural' | 'cultural';

export interface NonverbalTrial {
  id: number;
  emoji: string;
  description: string;
  gestureType: GestureType;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface NonverbalCommunicationStimuli {
  trials: NonverbalTrial[];
  timePerTrial: number;
}

export interface NonverbalTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type NonverbalCommunicationResponse = NonverbalTrialResponse[];

const TRIAL_BANK: Omit<NonverbalTrial, 'id'>[] = [
  // Universal gestures
  { emoji: '👍', description: 'Pulgar hacia arriba', gestureType: 'universal',
    question: '¿Qué significa normalmente este gesto?',
    options: ['Aprobación o acuerdo', 'Desacuerdo', 'Saludo', 'Señalar una dirección'],
    correctIndex: 0 },
  { emoji: '🤝', description: 'Apretón de manos', gestureType: 'universal',
    question: '¿Qué comunica generalmente un apretón de manos?',
    options: ['Hostilidad', 'Acuerdo, saludo o presentación', 'Despedida', 'Tristeza'],
    correctIndex: 1 },
  { emoji: '🤷', description: 'Encogerse de hombros', gestureType: 'universal',
    question: '¿Qué expresa encogerse de hombros?',
    options: ['Certeza total', 'Indiferencia o desconocimiento', 'Alegría', 'Amenaza'],
    correctIndex: 1 },
  // Facial expression context
  { emoji: '🙄', description: 'Ojos en blanco', gestureType: 'facial',
    question: '¿Qué comunica habitualmente este gesto?',
    options: ['Entusiasmo', 'Escepticismo, aburrimiento o fastidio', 'Sorpresa', 'Miedo'],
    correctIndex: 1 },
  { emoji: '😬', description: 'Expresión de incomodidad con los dientes apretados', gestureType: 'facial',
    question: '¿Qué sentimiento comunica esta expresión?',
    options: ['Felicidad', 'Incomodidad o vergüenza ajena', 'Ira intensa', 'Confusión'],
    correctIndex: 1 },
  // Postural
  { emoji: '🙅', description: 'Brazos cruzados frente al cuerpo', gestureType: 'postural',
    question: '¿Qué puede expresar esta postura corporal?',
    options: ['Apertura y receptividad', 'Defensa, cierre o desacuerdo', 'Alegría y entusiasmo', 'Cansancio'],
    correctIndex: 1 },
  { emoji: '🫣', description: 'Taparse la cara con las manos', gestureType: 'postural',
    question: '¿Qué emoción expresa habitualmente cubrirse la cara?',
    options: ['Orgullo', 'Vergüenza o sorpresa extrema', 'Alegría', 'Frustración leve'],
    correctIndex: 1 },
  // Cultural / context-dependent
  { emoji: '👋', description: 'Agitar la mano hacia alguien que se aleja', gestureType: 'cultural',
    question: '¿Qué comunica este gesto en la mayoría de culturas occidentales?',
    options: ['Amenaza', 'Despedida', 'Llamar la atención de alguien cercano', 'Negación'],
    correctIndex: 1 },
  { emoji: '🤞', description: 'Dedos cruzados', gestureType: 'cultural',
    question: '¿Qué significa este gesto en el contexto occidental?',
    options: ['Promesa solemne', 'Desear suerte o esperanza', 'Engaño', 'Desacuerdo'],
    correctIndex: 1 },
];

interface LevelParams { count: number; maxTypes: GestureType[]; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { count: 4, maxTypes: ['universal'],                           timePerTrial: 6000 },
  { count: 5, maxTypes: ['universal', 'facial'],                  timePerTrial: 6000 },
  { count: 6, maxTypes: ['universal', 'facial', 'postural'],      timePerTrial: 7000 },
  { count: 7, maxTypes: ['universal', 'facial', 'postural'],      timePerTrial: 7000 },
  { count: 9, maxTypes: ['universal', 'facial', 'postural', 'cultural'], timePerTrial: 8000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<NonverbalCommunicationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const eligible = TRIAL_BANK.filter(t => p.maxTypes.includes(t.gestureType));
  const selected = shuffle(eligible, rng).slice(0, p.count);
  const trials: NonverbalTrial[] = selected.map((t, idx) => ({ id: idx, ...t }));
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: NonverbalCommunicationStimuli, response: NonverbalCommunicationResponse): ExerciseSummary {
  const map = new Map(stimuli.trials.map(t => [t.id, t.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.trialId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
