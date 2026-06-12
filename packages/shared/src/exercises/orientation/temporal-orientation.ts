import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export type TemporalCategory = 'year' | 'season' | 'month' | 'dayOfWeek' | 'dayOfMonth' | 'approximateTime';

export interface TemporalQuestion {
  id: number;
  category: TemporalCategory;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TemporalOrientationStimuli {
  questions: TemporalQuestion[];
  referenceDate: string;  // ISO date used to compute correct answers
}

export interface TemporalTrialResponse {
  questionId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type TemporalOrientationResponse = TemporalTrialResponse[];

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const SEASONS: { months: number[]; name: string }[] = [
  { months: [11, 0, 1], name: 'Invierno' },
  { months: [2, 3, 4], name: 'Primavera' },
  { months: [5, 6, 7], name: 'Verano' },
  { months: [8, 9, 10], name: 'Otoño' },
];

function getSeason(month: number): string {
  return SEASONS.find(s => s.months.includes(month))?.name ?? 'Primavera';
}

function buildOptions(correct: string, pool: string[]): { options: string[]; correctIndex: number } {
  const others = pool.filter(p => p !== correct);
  const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 3);
  const combined = [correct, ...shuffled].sort(() => 0.5 - Math.random());
  return { options: combined, correctIndex: combined.indexOf(correct) };
}

interface LevelParams { categories: TemporalCategory[] }
const LEVELS: LevelParams[] = [
  { categories: ['year', 'season'] },
  { categories: ['year', 'season', 'month'] },
  { categories: ['year', 'season', 'month', 'dayOfWeek'] },
  { categories: ['year', 'month', 'dayOfWeek', 'dayOfMonth'] },
  { categories: ['year', 'month', 'dayOfWeek', 'dayOfMonth', 'approximateTime'] },
];

export function generate(level: number, _seed: number): ExerciseContent<TemporalOrientationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const now = new Date();
  const referenceDate = now.toISOString();
  const month = now.getMonth();
  const questions: TemporalQuestion[] = p.categories.map((cat, idx) => {
    switch (cat) {
      case 'year': {
        const correct = now.getFullYear().toString();
        const years = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(String);
        const { options, correctIndex } = buildOptions(correct, years);
        return { id: idx, category: cat, question: '¿En qué año estamos?', options, correctIndex };
      }
      case 'season': {
        const correct = getSeason(month);
        const { options, correctIndex } = buildOptions(correct, SEASONS.map(s => s.name));
        return { id: idx, category: cat, question: '¿En qué estación del año estamos?', options, correctIndex };
      }
      case 'month': {
        const correct = MONTHS[month]!;
        const pool = [...MONTHS];
        const { options, correctIndex } = buildOptions(correct, pool);
        return { id: idx, category: cat, question: '¿En qué mes estamos?', options, correctIndex };
      }
      case 'dayOfWeek': {
        const correct = DAYS[now.getDay()]!;
        const { options, correctIndex } = buildOptions(correct, [...DAYS]);
        return { id: idx, category: cat, question: '¿Qué día de la semana es hoy?', options, correctIndex };
      }
      case 'dayOfMonth': {
        const day = now.getDate();
        const correct = day.toString();
        const nearby = [day - 2, day - 1, day, day + 1, day + 2].filter(d => d >= 1 && d <= 31).map(String);
        const { options, correctIndex } = buildOptions(correct, nearby);
        return { id: idx, category: cat, question: '¿Qué día del mes es hoy?', options, correctIndex };
      }
      case 'approximateTime': {
        const h = now.getHours();
        const periods = ['por la mañana (6-12h)', 'al mediodía (12-14h)', 'por la tarde (14-20h)', 'por la noche (20-6h)'];
        const correct = h >= 6 && h < 12 ? periods[0]! : h >= 12 && h < 14 ? periods[1]! : h >= 14 && h < 20 ? periods[2]! : periods[3]!;
        const { options, correctIndex } = buildOptions(correct, periods);
        return { id: idx, category: cat, question: '¿En qué momento del día es aproximadamente?', options, correctIndex };
      }
    }
  });
  return { level, seed: _seed, timeLimit: questions.length * 20, stimuli: { questions, referenceDate } };
}

export function summarize(stimuli: TemporalOrientationStimuli, response: TemporalOrientationResponse): ExerciseSummary {
  const map = new Map(stimuli.questions.map(q => [q.id, q.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.questionId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
