import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type BasicEmotion = 'alegría' | 'tristeza' | 'enfado' | 'miedo' | 'sorpresa' | 'disgusto' | 'desprecio' | 'calma';

export interface EmotionTrial {
  id: number;
  faceEmoji: string;
  emotion: BasicEmotion;
  options: BasicEmotion[];
  intensity: 'high' | 'medium' | 'low';
}

export interface EmotionRecognitionStimuli {
  trials: EmotionTrial[];
  timePerTrial: number;
}

export interface EmotionTrialResponse {
  trialId: number;
  chosenEmotion: BasicEmotion;
  reactionTimeMs: number;
}

export type EmotionRecognitionResponse = EmotionTrialResponse[];

// Face emojis grouped by emotion and intensity
const FACE_BANK: Record<BasicEmotion, string[]> = {
  'alegría':   ['😁', '😄', '😊'],
  'tristeza':  ['😭', '😢', '😞'],
  'enfado':    ['😡', '😠', '😤'],
  'miedo':     ['😱', '😨', '😰'],
  'sorpresa':  ['😲', '😮', '🤭'],
  'disgusto':  ['🤢', '🤮', '😖'],
  'desprecio': ['😒', '🙄', '😑'],
  'calma':     ['😌', '😶', '🙂'],
};

interface LevelParams { trials: number; emotionSet: BasicEmotion[]; intensityIdx: number; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { trials: 8,  emotionSet: ['alegría', 'tristeza', 'enfado', 'miedo'],                               intensityIdx: 0, timePerTrial: 5000 },
  { trials: 10, emotionSet: ['alegría', 'tristeza', 'enfado', 'miedo', 'sorpresa'],                    intensityIdx: 0, timePerTrial: 4500 },
  { trials: 12, emotionSet: ['alegría', 'tristeza', 'enfado', 'miedo', 'sorpresa', 'disgusto'],        intensityIdx: 1, timePerTrial: 4000 },
  { trials: 14, emotionSet: ['alegría', 'tristeza', 'enfado', 'miedo', 'sorpresa', 'disgusto', 'desprecio'], intensityIdx: 1, timePerTrial: 3500 },
  { trials: 16, emotionSet: ['alegría', 'tristeza', 'enfado', 'miedo', 'sorpresa', 'disgusto', 'desprecio', 'calma'], intensityIdx: 2, timePerTrial: 3000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<EmotionRecognitionStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const intensities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  const intensity = intensities[p.intensityIdx] ?? 'high';
  const trials: EmotionTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const emotion = p.emotionSet[Math.floor(rng() * p.emotionSet.length)] as BasicEmotion;
    const faces = FACE_BANK[emotion];
    const faceEmoji = faces[p.intensityIdx] ?? faces[0]!;
    const distractors = shuffle(p.emotionSet.filter(e => e !== emotion), rng).slice(0, 3) as BasicEmotion[];
    const options = shuffle([emotion, ...distractors], rng) as BasicEmotion[];
    return { id, faceEmoji, emotion, options, intensity };
  });
  return { level, seed, timeLimit: Math.ceil((p.trials * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: EmotionRecognitionStimuli, response: EmotionRecognitionResponse): ExerciseSummary {
  const map = new Map(stimuli.trials.map(t => [t.id, t.emotion]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenEmotion === map.get(r.trialId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
