import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface LineTrial {
  id: number;
  targetAngles: number[];   // target line angles in degrees
  referenceAngles: number[]; // fan of reference lines to match against
  correctIndices: number[]; // indices in referenceAngles that match targetAngles
}

export interface LineOrientationStimuli {
  trials: LineTrial[];
  timePerTrial: number;
}

export interface LineTrialResponse {
  trialId: number;
  chosenIndices: number[];
  reactionTimeMs: number;
}

export type LineOrientationResponse = LineTrialResponse[];

interface LevelParams { trials: number; lineCount: number; angleDiff: number; refLines: number; timePerTrial: number }
const LEVELS: LevelParams[] = [
  { trials: 8,  lineCount: 1, angleDiff: 45, refLines: 5,  timePerTrial: 8000 },
  { trials: 10, lineCount: 1, angleDiff: 30, refLines: 7,  timePerTrial: 7000 },
  { trials: 12, lineCount: 2, angleDiff: 30, refLines: 8,  timePerTrial: 8000 },
  { trials: 14, lineCount: 2, angleDiff: 18, refLines: 10, timePerTrial: 9000 },
  { trials: 16, lineCount: 3, angleDiff: 18, refLines: 10, timePerTrial: 10000 },
];

export function generate(level: number, seed: number): ExerciseContent<LineOrientationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);

  // Build reference fan: angles from 0 to 180 at angleDiff intervals
  const maxAngle = 180;
  const refAngles: number[] = [];
  for (let a = 0; a <= maxAngle; a += p.angleDiff) {
    if (refAngles.length < p.refLines) refAngles.push(a);
  }

  const trials: LineTrial[] = Array.from({ length: p.trials }, (_, id) => {
    const targetAngles: number[] = [];
    const correctIndices: number[] = [];
    const usedRefIndices = new Set<number>();

    for (let k = 0; k < p.lineCount; k++) {
      let refIdx: number;
      do { refIdx = Math.floor(rng() * refAngles.length); } while (usedRefIndices.has(refIdx));
      usedRefIndices.add(refIdx);
      targetAngles.push(refAngles[refIdx] as number);
      correctIndices.push(refIdx);
    }

    return { id, targetAngles, referenceAngles: refAngles, correctIndices };
  });

  return { level, seed, timeLimit: Math.ceil((p.trials * p.timePerTrial) / 1000), stimuli: { trials, timePerTrial: p.timePerTrial } };
}

export function summarize(stimuli: LineOrientationStimuli, response: LineOrientationResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.trials.map(t => [t.id, t.correctIndices.slice().sort()]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    const correct = correctMap.get(r.trialId) ?? [];
    const chosen = r.chosenIndices.slice().sort();
    const isCorrect = correct.length === chosen.length && correct.every((v, i) => v === chosen[i]);
    if (isCorrect) hits++; else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
