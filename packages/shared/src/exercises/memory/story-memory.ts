import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';

export interface StoryQuestion {
  id: number;
  question: string;
  answer: string;
  options: string[];  // answer is always one of these
}

export interface StoryMemoryStimuli {
  story: string;
  questions: StoryQuestion[];
  studyTimeMs: number;
  delayTimeMs: number;
  timeLimit: number;
}

export type StoryMemoryResponse = Array<{ questionId: number; chosen: string }>;

// Stories and questions are hardcoded (not seed-based since they're prose)
const STORIES: StoryMemoryStimuli[] = [
  {
    story: 'María fue al mercado el martes por la mañana. Compró manzanas, leche y pan. Al volver, se encontró con su vecina Ana, que llevaba un paraguas azul. Hablaron durante diez minutos sobre el tiempo.',
    questions: [
      { id: 0, question: '¿Cuándo fue María al mercado?', answer: 'El martes por la mañana', options: ['El lunes por la tarde','El martes por la mañana','El miércoles al mediodía','El jueves por la noche'] },
      { id: 1, question: '¿Qué compró María?', answer: 'Manzanas, leche y pan', options: ['Naranjas, leche y pan','Manzanas, leche y pan','Manzanas, zumo y galletas','Pan, mantequilla y huevos'] },
      { id: 2, question: '¿Cómo se llamaba la vecina?', answer: 'Ana', options: ['Laura','Carmen','Ana','Sofía'] },
      { id: 3, question: '¿De qué color era el paraguas?', answer: 'Azul', options: ['Rojo','Verde','Azul','Negro'] },
      { id: 4, question: '¿Cuánto tiempo hablaron?', answer: 'Diez minutos', options: ['Cinco minutos','Quince minutos','Diez minutos','Media hora'] },
    ],
    studyTimeMs: 15000,
    delayTimeMs: 3000,
    timeLimit: 120,
  },
  {
    story: 'El doctor Pérez llegó al hospital a las ocho de la mañana. Atendió a veinte pacientes y realizó dos operaciones. A la una del mediodía comió un bocadillo de jamón en la cafetería. Por la tarde, impartió una clase a estudiantes de medicina sobre cardiología.',
    questions: [
      { id: 0, question: '¿A qué hora llegó al hospital?', answer: 'A las ocho', options: ['A las siete','A las ocho','A las nueve','A las diez'] },
      { id: 1, question: '¿Cuántos pacientes atendió?', answer: 'Veinte', options: ['Diez','Quince','Veinte','Veinticinco'] },
      { id: 2, question: '¿Qué comió al mediodía?', answer: 'Un bocadillo de jamón', options: ['Una ensalada','Un bocadillo de jamón','Un menú del día','Fruta y yogur'] },
      { id: 3, question: '¿Sobre qué fue la clase?', answer: 'Cardiología', options: ['Neurología','Cardiología','Pediatría','Traumatología'] },
      { id: 4, question: '¿Cuántas operaciones realizó?', answer: 'Dos', options: ['Una','Dos','Tres','Cuatro'] },
    ],
    studyTimeMs: 20000,
    delayTimeMs: 4000,
    timeLimit: 150,
  },
];

interface LevelParams { storyIndex: number; questionCount: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { storyIndex: 0, questionCount: 3, timeLimit: 120 },
  2: { storyIndex: 0, questionCount: 5, timeLimit: 120 },
  3: { storyIndex: 1, questionCount: 3, timeLimit: 150 },
  4: { storyIndex: 1, questionCount: 5, timeLimit: 150 },
  5: { storyIndex: 1, questionCount: 5, timeLimit: 120 },
};

export function generate(level: number, _seed: number): ExerciseContent<StoryMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const base = STORIES[p.storyIndex] ?? STORIES[0]!;
  const stimuli: StoryMemoryStimuli = {
    ...base,
    questions: base.questions.slice(0, p.questionCount),
    timeLimit: p.timeLimit,
  };
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli };
}

export function evaluate(s: StoryMemoryStimuli, r: StoryMemoryResponse): TrialResult<StoryMemoryStimuli, StoryMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: StoryMemoryStimuli, r: StoryMemoryResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { questionCount: s.questions.length } };
}

function computeMetrics(s: StoryMemoryStimuli, r: StoryMemoryResponse) {
  const map = new Map(r.map((x) => [x.questionId, x.chosen]));
  let hits = 0, errors = 0;
  for (const q of s.questions) {
    if (map.get(q.id) === q.answer) hits++;
    else errors++;
  }
  return { hits, errors };
}
