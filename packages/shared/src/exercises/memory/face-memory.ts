import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Face memory uses avatar placeholders (emoji-based) since real face images aren't available
export interface FaceItem {
  id: number;
  avatar: string;   // emoji representing a face archetype
  isTarget: boolean;
}

export interface FaceMemoryStimuli {
  studyFaces: FaceItem[];   // faces to memorize
  testFaces: FaceItem[];    // study + distractor faces mixed
  studyTimeMs: number;
  delayTimeMs: number;
  timeLimit: number;
}

export type FaceMemoryResponse = number[];  // ids of faces user identified as "seen before"

const FACE_POOL = ['👱','👩','🧔','👴','👵','🧑','👦','👧','🧓','🧒','👩‍🦰','👩‍🦱','👩‍🦳','👩‍🦲','👨‍🦰','👨‍🦱','👨‍🦳','👨‍🦲'];

interface LevelParams { faceCount: number; distractors: number; studyMs: number; delayMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { faceCount: 4,  distractors: 4,  studyMs: 6000, delayMs: 2000, timeLimit: 60 },
  2: { faceCount: 6,  distractors: 4,  studyMs: 5000, delayMs: 3000, timeLimit: 80 },
  3: { faceCount: 8,  distractors: 6,  studyMs: 4000, delayMs: 4000, timeLimit: 100 },
  4: { faceCount: 10, distractors: 8,  studyMs: 3000, delayMs: 5000, timeLimit: 120 },
  5: { faceCount: 12, distractors: 10, studyMs: 3000, delayMs: 6000, timeLimit: 140 },
};

export function generate(level: number, seed: number): ExerciseContent<FaceMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const pool = [...FACE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i] as string; pool[i] = pool[j] as string; pool[j] = tmp;
  }
  const studyFaces: FaceItem[] = pool.slice(0, p.faceCount).map((avatar, id) => ({ id, avatar, isTarget: true }));
  const distractorFaces: FaceItem[] = pool.slice(p.faceCount, p.faceCount + p.distractors).map((avatar, i) => ({
    id: p.faceCount + i, avatar, isTarget: false,
  }));
  const testFaces = [...studyFaces, ...distractorFaces];
  // Shuffle test faces
  for (let i = testFaces.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = testFaces[i] as FaceItem; testFaces[i] = testFaces[j] as FaceItem; testFaces[j] = tmp;
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    studyFaces, testFaces, studyTimeMs: p.studyMs, delayTimeMs: p.delayMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: FaceMemoryStimuli, r: FaceMemoryResponse): TrialResult<FaceMemoryStimuli, FaceMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: FaceMemoryStimuli, r: FaceMemoryResponse): ExerciseSummary {
  const { hits, errors, falseAlarms, omissions } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { falseAlarms, omissions, targetCount: s.studyFaces.length } };
}

function computeMetrics(s: FaceMemoryStimuli, r: FaceMemoryResponse) {
  const selected = new Set(r);
  const targets = new Set(s.studyFaces.map((f) => f.id));
  const hits = [...selected].filter((id) => targets.has(id)).length;
  const falseAlarms = [...selected].filter((id) => !targets.has(id)).length;
  const omissions = targets.size - hits;
  return { hits, errors: falseAlarms + omissions, falseAlarms, omissions };
}
