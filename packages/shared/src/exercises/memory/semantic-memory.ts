import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';

export interface SemanticQuestion {
  id: number;
  question: string;
  answer: string;
  options: string[];
  category: string;
}

export interface SemanticMemoryStimuli {
  questions: SemanticQuestion[];
  timeLimit: number;
}

export type SemanticMemoryResponse = Array<{ questionId: number; chosen: string }>;

const ALL_QUESTIONS: SemanticQuestion[] = [
  // Level 1-2: very familiar
  { id: 0,  category: 'geography',  question: '¿Cuál es la capital de España?',           answer: 'Madrid',       options: ['Barcelona','Madrid','Valencia','Sevilla'] },
  { id: 1,  category: 'science',    question: '¿Cuántos planetas tiene el sistema solar?', answer: '8',            options: ['7','8','9','10'] },
  { id: 2,  category: 'animals',    question: '¿Cuál es el animal más grande del mundo?',  answer: 'La ballena azul', options: ['El elefante','La jirafa','La ballena azul','El tiburón ballena'] },
  { id: 3,  category: 'history',    question: '¿En qué año terminó la Segunda Guerra Mundial?', answer: '1945', options: ['1939','1943','1945','1948'] },
  { id: 4,  category: 'science',    question: '¿A qué temperatura hierve el agua?',        answer: '100°C',        options: ['90°C','95°C','100°C','110°C'] },
  // Level 3: moderate
  { id: 5,  category: 'arts',       question: '¿Quién pintó la Mona Lisa?',                answer: 'Leonardo da Vinci', options: ['Miguel Ángel','Rafael','Leonardo da Vinci','Botticelli'] },
  { id: 6,  category: 'geography',  question: '¿Cuál es el río más largo del mundo?',      answer: 'El Nilo',      options: ['El Amazonas','El Nilo','El Misisipi','El Yangtsé'] },
  { id: 7,  category: 'science',    question: '¿Cuántos huesos tiene el cuerpo humano adulto?', answer: '206', options: ['186','196','206','216'] },
  { id: 8,  category: 'literature', question: '¿Quién escribió Don Quijote?',              answer: 'Cervantes',    options: ['Lope de Vega','Quevedo','Cervantes','Calderón'] },
  // Level 4-5: less common
  { id: 9,  category: 'science',    question: '¿Cuál es el símbolo químico del oro?',      answer: 'Au',           options: ['Go','Or','Au','Ag'] },
  { id: 10, category: 'geography',  question: '¿Cuál es el país más pequeño del mundo?',  answer: 'Vaticano',     options: ['Mónaco','Liechtenstein','Vaticano','San Marino'] },
  { id: 11, category: 'science',    question: '¿Qué gas es más abundante en la atmósfera?', answer: 'Nitrógeno',  options: ['Oxígeno','Nitrógeno','Argón','Dióxido de carbono'] },
  { id: 12, category: 'history',    question: '¿En qué año llegó el hombre a la luna?',   answer: '1969',         options: ['1965','1967','1969','1971'] },
];

interface LevelParams { questionCount: number; fromIdx: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { questionCount: 4,  fromIdx: 0, timeLimit: 60 },
  2: { questionCount: 5,  fromIdx: 0, timeLimit: 70 },
  3: { questionCount: 5,  fromIdx: 4, timeLimit: 80 },
  4: { questionCount: 5,  fromIdx: 7, timeLimit: 80 },
  5: { questionCount: 6,  fromIdx: 7, timeLimit: 90 },
};

export function generate(level: number, _seed: number): ExerciseContent<SemanticMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const questions = ALL_QUESTIONS.slice(p.fromIdx, p.fromIdx + p.questionCount);
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli: { questions, timeLimit: p.timeLimit } };
}

export function evaluate(s: SemanticMemoryStimuli, r: SemanticMemoryResponse): TrialResult<SemanticMemoryStimuli, SemanticMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: SemanticMemoryStimuli, r: SemanticMemoryResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { questionCount: s.questions.length } };
}

function computeMetrics(s: SemanticMemoryStimuli, r: SemanticMemoryResponse) {
  const map = new Map(r.map((x) => [x.questionId, x.chosen]));
  let hits = 0, errors = 0;
  for (const q of s.questions) {
    if (map.get(q.id) === q.answer) hits++;
    else errors++;
  }
  return { hits, errors };
}
