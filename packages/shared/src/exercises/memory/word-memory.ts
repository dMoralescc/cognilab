import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface WordMemoryStimuli {
  studyWords: string[];
  testWords: string[];   // study + distractor words
  studyTimeMs: number;
  delayTimeMs: number;
  taskType: 'recognition' | 'recall';
  timeLimit: number;
}

// For recognition: array of words user identified as "studied"
// For recall: array of words user typed (compared by value)
export type WordMemoryResponse = string[];

const CONCRETE_WORDS = ['mesa','silla','puerta','libro','árbol','gato','luna','agua','casa','pan','piedra','flor','cielo','barco','mano'];
const ABSTRACT_WORDS = ['amor','paz','tiempo','idea','miedo','fuerza','gracia','orden','caos','duda','calma','fe','sueño','azar','norma'];
const INTERFERENCE_WORDS = ['ventana','campo','pájaro','roca','brisa','ciudad','playa','monte','niño','camino'];

interface LevelParams { wordCount: number; distractors: number; studyMs: number; delayMs: number; pool: string[]; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { wordCount: 5,  distractors: 5,  studyMs: 6000, delayMs: 2000, pool: CONCRETE_WORDS, timeLimit: 60 },
  2: { wordCount: 8,  distractors: 6,  studyMs: 5000, delayMs: 3000, pool: CONCRETE_WORDS, timeLimit: 80 },
  3: { wordCount: 10, distractors: 8,  studyMs: 4000, delayMs: 4000, pool: CONCRETE_WORDS, timeLimit: 100 },
  4: { wordCount: 12, distractors: 10, studyMs: 3000, delayMs: 5000, pool: ABSTRACT_WORDS, timeLimit: 120 },
  5: { wordCount: 15, distractors: 12, studyMs: 2500, delayMs: 6000, pool: [...ABSTRACT_WORDS, ...INTERFERENCE_WORDS], timeLimit: 140 },
};

export function generate(level: number, seed: number): ExerciseContent<WordMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const pool = [...p.pool];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i] as string; pool[i] = pool[j] as string; pool[j] = tmp;
  }
  const studyWords = pool.slice(0, p.wordCount);
  const distractors = pool.slice(p.wordCount, p.wordCount + p.distractors);
  const testWords = [...studyWords, ...distractors];
  for (let i = testWords.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = testWords[i] as string; testWords[i] = testWords[j] as string; testWords[j] = tmp;
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    studyWords, testWords, studyTimeMs: p.studyMs, delayTimeMs: p.delayMs,
    taskType: 'recognition', timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: WordMemoryStimuli, r: WordMemoryResponse): TrialResult<WordMemoryStimuli, WordMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: WordMemoryStimuli, r: WordMemoryResponse): ExerciseSummary {
  const { hits, errors, falseAlarms, omissions } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { falseAlarms, omissions, wordCount: s.studyWords.length } };
}

function computeMetrics(s: WordMemoryStimuli, r: WordMemoryResponse) {
  const studySet = new Set(s.studyWords);
  const respSet = new Set(r);
  const hits = [...respSet].filter((w) => studySet.has(w)).length;
  const falseAlarms = [...respSet].filter((w) => !studySet.has(w)).length;
  const omissions = studySet.size - hits;
  return { hits, errors: falseAlarms + omissions, falseAlarms, omissions };
}
