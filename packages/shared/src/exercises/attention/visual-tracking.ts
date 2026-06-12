import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Visual tracking: targets and distractors move; user identifies which objects were targets at the end.
export interface MovingObject {
  id: number;
  isTarget: boolean;
  // Initial position [0,1]
  x: number;
  y: number;
  // Velocity vector [0,1] — used by the player to animate
  vx: number;
  vy: number;
}

export interface VisualTrackingStimuli {
  objects: MovingObject[];
  targetCount: number;
  durationMs: number; // how long objects move before stopping
  speedMultiplier: number; // relative speed (1 = base)
  timeLimit: number;
}

export type VisualTrackingResponse = number[]; // ids of objects user thinks were targets

interface LevelParams { targets: number; total: number; durationMs: number; speed: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { targets: 1, total: 4,  durationMs: 4000,  speed: 0.5, timeLimit: 30 },
  2: { targets: 2, total: 6,  durationMs: 5000,  speed: 0.7, timeLimit: 40 },
  3: { targets: 2, total: 8,  durationMs: 6000,  speed: 1.0, timeLimit: 50 },
  4: { targets: 3, total: 10, durationMs: 7000,  speed: 1.3, timeLimit: 60 },
  5: { targets: 4, total: 12, durationMs: 8000,  speed: 1.6, timeLimit: 70 },
};

export function generate(level: number, seed: number): ExerciseContent<VisualTrackingStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);

  const isTargetArr = [
    ...Array(p.targets).fill(true),
    ...Array(p.total - p.targets).fill(false),
  ] as boolean[];
  for (let i = isTargetArr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = isTargetArr[i] as boolean; isTargetArr[i] = isTargetArr[j] as boolean; isTargetArr[j] = tmp;
  }

  const objects: MovingObject[] = isTargetArr.map((isTarget, id) => {
    // Random starting position with margin
    const x = 0.1 + rng() * 0.8;
    const y = 0.1 + rng() * 0.8;
    // Random velocity direction
    const angle = rng() * Math.PI * 2;
    const speed = 0.08 + rng() * 0.04;
    return { id, isTarget, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  });

  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    objects, targetCount: p.targets, durationMs: p.durationMs,
    speedMultiplier: p.speed, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: VisualTrackingStimuli, r: VisualTrackingResponse): TrialResult<VisualTrackingStimuli, VisualTrackingResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: VisualTrackingStimuli, r: VisualTrackingResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null,
    rawData: { targetCount: s.targetCount, totalObjects: s.objects.length } };
}

function computeMetrics(s: VisualTrackingStimuli, r: VisualTrackingResponse) {
  const targetIds = new Set(s.objects.filter((o) => o.isTarget).map((o) => o.id));
  const selected = new Set(r);
  const hits = [...selected].filter((id) => targetIds.has(id)).length;
  const misses = targetIds.size - hits;
  const falseAlarms = [...selected].filter((id) => !targetIds.has(id)).length;
  return { hits, errors: misses + falseAlarms };
}
