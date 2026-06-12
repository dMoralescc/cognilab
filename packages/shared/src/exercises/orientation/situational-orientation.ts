import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export interface SituationalQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface SituationalOrientationStimuli {
  questions: SituationalQuestion[];
  situationContext: string;
}

export interface SituationalTrialResponse {
  questionId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type SituationalOrientationResponse = SituationalTrialResponse[];

interface LevelParams { questionCount: number; contextComplexity: 'familiar' | 'common' | 'novel' }
const LEVELS: LevelParams[] = [
  { questionCount: 2, contextComplexity: 'familiar' },
  { questionCount: 3, contextComplexity: 'familiar' },
  { questionCount: 3, contextComplexity: 'common' },
  { questionCount: 4, contextComplexity: 'common' },
  { questionCount: 5, contextComplexity: 'novel' },
];

const QUESTION_BANKS: Record<string, SituationalQuestion[]> = {
  familiar: [
    { id: 0, question: '¿Por qué estás aquí hoy?', options: ['Estoy de visita turística', 'Vengo a una consulta o evaluación', 'Estoy perdido/a', 'Vine a comprar algo'], correctIndex: 1 },
    { id: 1, question: '¿Qué te trajo hasta este lugar?', options: ['Una cita médica', 'Un accidente', 'Me lo pidieron sin razón', 'Vine a dormir'], correctIndex: 0 },
    { id: 2, question: '¿Quién te acompañó hasta aquí?', options: ['Vine solo/a en taxi o transporte', 'Me trajo un familiar o conocido', 'No sé cómo llegué', 'Vine andando desde casa'], correctIndex: 1 },
    { id: 3, question: '¿Qué va a ocurrir durante esta visita?', options: ['Me van a hacer algunas pruebas o evaluaciones', 'Voy a hacer deporte', 'Voy a comer y marcharme', 'No pasará nada especial'], correctIndex: 0 },
  ],
  common: [
    { id: 0, question: '¿Qué estabas haciendo antes de venir aquí?', options: ['Estaba durmiendo en casa', 'Estaba con mi familia o haciendo mis actividades habituales', 'Estaba de viaje en otro país', 'No recuerdo qué hacía'], correctIndex: 1 },
    { id: 1, question: '¿A qué hora aproximadamente llegaste?', options: ['Hace varios días', 'Hace unos minutos o hace poco tiempo', 'Llevas aquí toda la semana', 'No has llegado todavía'], correctIndex: 1 },
    { id: 2, question: '¿Qué harás cuando termine esta visita?', options: ['Me quedaré a vivir aquí', 'Volveré a casa o a mi lugar habitual', 'Iré al extranjero', 'No hay nada planeado'], correctIndex: 1 },
    { id: 3, question: '¿Quién sabe que estás aquí?', options: ['Nadie sabe dónde estoy', 'Mi familia o las personas que me cuidan', 'Solo yo lo sé', 'No es necesario que nadie lo sepa'], correctIndex: 1 },
    { id: 4, question: '¿Qué día acordaste esta visita?', options: ['No hubo ningún acuerdo previo', 'Se acordó con antelación mediante una cita', 'Lo decidí hace mucho tiempo sin cita', 'Fue algo espontáneo sin planificación'], correctIndex: 1 },
  ],
  novel: [
    { id: 0, question: 'Estás en un lugar nuevo para ti. ¿Cómo te orientas?', options: ['Pregunto a alguien del lugar', 'Me quedo quieto/a sin hacer nada', 'Salgo corriendo', 'Lloro hasta que alguien me ayude'], correctIndex: 0 },
    { id: 1, question: 'No reconoces este sitio. ¿Qué es lo más apropiado?', options: ['Buscar una referencia conocida o pedir ayuda', 'Ignorarlo y actuar como si lo conociera', 'Intentar recordar de manera forzada', 'Marcharme sin más'], correctIndex: 0 },
    { id: 2, question: '¿Qué información te ayudaría a orientarte mejor en un lugar desconocido?', options: ['El nombre del lugar y con quién estás', 'El color de las paredes', 'El tipo de música que suena', 'Nada, es imposible orientarse'], correctIndex: 0 },
    { id: 3, question: 'Si alguien te pregunta dónde estás y no lo sabes, ¿qué dirías?', options: ['Inventarías una respuesta cualquiera', 'Dirías honestamente que no lo sabes con certeza', 'Te callarías y fingirías que sí lo sabes', 'Cambiarías de tema'], correctIndex: 1 },
    { id: 4, question: 'En esta situación nueva, ¿quién podría ayudarte a orientarte?', options: ['El personal del lugar o un acompañante de confianza', 'Nadie puede ayudarme', 'Alguien completamente desconocido', 'Un objeto del entorno'], correctIndex: 0 },
  ],
};

export function generate(level: number, _seed: number): ExerciseContent<SituationalOrientationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const bank = QUESTION_BANKS[p.contextComplexity] ?? QUESTION_BANKS['familiar']!;
  const questions = bank.slice(0, p.questionCount).map((q, idx) => ({ ...q, id: idx }));
  const contexts: Record<string, string> = {
    familiar: 'Consulta de neuropsicología en un centro de salud habitual',
    common: 'Centro médico o clínica de rehabilitación',
    novel: 'Lugar nuevo o desconocido para el paciente',
  };
  return {
    level, seed: _seed, timeLimit: questions.length * 25,
    stimuli: { questions, situationContext: contexts[p.contextComplexity] ?? contexts['familiar']! },
  };
}

export function summarize(stimuli: SituationalOrientationStimuli, response: SituationalOrientationResponse): ExerciseSummary {
  const map = new Map(stimuli.questions.map(q => [q.id, q.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.questionId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
