import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type RotationFigure = { shape: string; is3D: boolean };
export type Answer = 'same' | 'mirror';

export interface RotationTrial {
  id: number;
  figure: string;
  rotationAngle: number;
  isMirror: boolean;
  correctAnswer: Answer;
}

export interface MentalRotationStimuli {
  trials: RotationTrial[];
  timePerTrial: number;
}

export interface RotationTrialResponse {
  trialId: number;
  answer: Answer;
  reactionTimeMs: number;
}

export type MentalRotationResponse = RotationTrialResponse[];

// Simple 2D shapes encoded as CSS rotation subjects
const SHAPES_2D = ['▲', '◆', '★', 'L', 'F', 'Z'];
const SHAPES_3D = ['⬡', '⬢', '⎔', '⏣', '⬟', '⌬'];

interface LevelParams { trials: number; maxAngle: number; mirrorRate: number; is3D: boolean; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { trials: 10, maxAngle:  45, mirrorRate: 0.3, is3D: false, timePerTrial: 6000 },
  { trials: 12, maxAngle:  90, mirrorRate: 0.4, is3D: false, timePerTrial: 5000 },
  { trials: 14, maxAngle: 135, mirrorRate: 0.5, is3D: false, timePerTrial: 5000 },
  { trials: 16, maxAngle: 180, mirrorRate: 0.5, is3D: true,  timePerTrial: 4000 },
  { trials: 20, maxAngle: 360, mirrorRate: 0.5, is3D: true,  timePerTrial: 3500 },
];

export function generate(level: number, seed: number): ExerciseContent<MentalRotationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const shapes = p.is3D ? SHAPES_3D : SHAPES_2D;
  const mirrorCount = Math.round(p.trials * p.mirrorRate);
  const answers: Answer[] = [...Array(mirrorCount).fill('mirror'), ...Array(p.trials - mirrorCount).fill('same')] as Answer[];
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = answers[i] as Answer; answers[i] = answers[j] as Answer; answers[j] = tmp;
  }
  const trials: RotationTrial[] = answers.map((correctAnswer, id) => {
    const figure = shapes[Math.floor(rng() * shapes.length)] as string;
    const step = p.maxAngle <= 90 ? 45 : 45;
    const steps = Math.ceil(p.maxAngle / step);
    const rotationAngle = (Math.floor(rng() * steps) + 1) * step;
    return { id, figure, rotationAngle, isMirror: correctAnswer === 'mirror', correctAnswer };
  });
  return { level, seed, timeLimit: Math.ceil((p.trials * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: MentalRotationStimuli, response: MentalRotationResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.trials.map(t => [t.id, t.correctAnswer]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.answer === correctMap.get(r.trialId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
