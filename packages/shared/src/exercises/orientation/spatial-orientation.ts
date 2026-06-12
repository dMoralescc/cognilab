import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export type SpatialCategory = 'country' | 'city' | 'placeType' | 'neighborhood' | 'floor' | 'cardinalDirection';

export interface SpatialQuestion {
  id: number;
  category: SpatialCategory;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SpatialOrientationStimuli {
  questions: SpatialQuestion[];
  locationContext: string;
}

export interface SpatialTrialResponse {
  questionId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type SpatialOrientationResponse = SpatialTrialResponse[];

interface LevelParams { categories: SpatialCategory[] }
const LEVELS: LevelParams[] = [
  { categories: ['country', 'city'] },
  { categories: ['country', 'city', 'placeType'] },
  { categories: ['country', 'city', 'placeType', 'neighborhood'] },
  { categories: ['country', 'city', 'placeType', 'neighborhood', 'floor'] },
  { categories: ['country', 'city', 'placeType', 'neighborhood', 'floor', 'cardinalDirection'] },
];

const QUESTION_BANK: Record<SpatialCategory, { question: string; options: string[]; correctIndex: number }> = {
  country: {
    question: '¿En qué país estamos?',
    options: ['Francia', 'España', 'México', 'Argentina'],
    correctIndex: 1,
  },
  city: {
    question: '¿En qué ciudad estás ahora mismo?',
    options: ['Barcelona', 'Madrid', 'Valencia', 'Sevilla'],
    correctIndex: 1,
  },
  placeType: {
    question: '¿En qué tipo de lugar estás?',
    options: ['En un hospital', 'En una clínica o consulta', 'En casa', 'En la calle'],
    correctIndex: 1,
  },
  neighborhood: {
    question: '¿En qué barrio o zona de la ciudad estás?',
    options: ['Zona norte', 'Zona sur', 'Centro', 'Zona este'],
    correctIndex: 2,
  },
  floor: {
    question: '¿En qué planta del edificio estás?',
    options: ['Planta baja', 'Primera planta', 'Segunda planta', 'Tercera planta'],
    correctIndex: 0,
  },
  cardinalDirection: {
    question: '¿Hacia qué punto cardinal mira la entrada principal del edificio?',
    options: ['Norte', 'Sur', 'Este', 'Oeste'],
    correctIndex: 1,
  },
};

export function generate(level: number, _seed: number): ExerciseContent<SpatialOrientationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const questions: SpatialQuestion[] = p.categories.map((cat, idx) => ({
    id: idx,
    category: cat,
    ...QUESTION_BANK[cat],
  }));
  return {
    level, seed: _seed, timeLimit: questions.length * 20,
    stimuli: { questions, locationContext: 'Clínica de neuropsicología' },
  };
}

export function summarize(stimuli: SpatialOrientationStimuli, response: SpatialOrientationResponse): ExerciseSummary {
  const map = new Map(stimuli.questions.map(q => [q.id, q.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.questionId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
