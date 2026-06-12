import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type TrailVersion = 'A' | 'B';

export interface TrailNode {
  id: number;
  label: string;    // number (A) or alternating number/letter (B)
  x: number;        // 0-1 normalized
  y: number;
}

export interface TrailMakingStimuli {
  nodes: TrailNode[];
  version: TrailVersion;
  timeLimit: number;
}

// Response: sequence of node ids in the order the user connected them
export type TrailMakingResponse = number[];

interface LevelParams { count: number; version: TrailVersion; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { count: 10, version: 'A', timeLimit: 60 },
  2: { count: 15, version: 'A', timeLimit: 75 },
  3: { count: 10, version: 'B', timeLimit: 75 },
  4: { count: 15, version: 'B', timeLimit: 90 },
  5: { count: 25, version: 'B', timeLimit: 120 },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generate(level: number, seed: number): ExerciseContent<TrailMakingStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const labels: string[] = [];
  if (p.version === 'A') {
    for (let i = 1; i <= p.count; i++) labels.push(String(i));
  } else {
    const pairs = Math.ceil(p.count / 2);
    for (let i = 0; i < pairs; i++) {
      labels.push(String(i + 1));
      if (labels.length < p.count) labels.push(LETTERS[i] ?? String.fromCharCode(65 + i));
    }
  }
  // Scatter nodes with margin to avoid overlap (simple grid jitter)
  const cols = Math.ceil(Math.sqrt(p.count));
  const rows = Math.ceil(p.count / cols);
  const positions = Array.from({ length: rows * cols }, (_, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    return {
      x: (col + 0.5 + (rng() * 0.4 - 0.2)) / cols,
      y: (row + 0.5 + (rng() * 0.4 - 0.2)) / rows,
    };
  });
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = positions[i]!; positions[i] = positions[j]!; positions[j] = tmp;
  }
  const nodes: TrailNode[] = labels.map((label, id) => ({
    id, label,
    x: Math.max(0.05, Math.min(0.95, positions[id]?.x ?? 0.5)),
    y: Math.max(0.05, Math.min(0.95, positions[id]?.y ?? 0.5)),
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: { nodes, version: p.version, timeLimit: p.timeLimit } };
}

export function evaluate(s: TrailMakingStimuli, r: TrailMakingResponse): TrialResult<TrailMakingStimuli, TrailMakingResponse> {
  const { errors } = computeMetrics(s, r);
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: TrailMakingStimuli, r: TrailMakingResponse, durationMs: number): ExerciseSummary {
  const { errors, completed } = computeMetrics(s, r);
  return { hits: completed, errors, reactionTimeMs: durationMs,
    rawData: { durationMs, completed, total: s.nodes.length, version: s.version } };
}

function computeMetrics(s: TrailMakingStimuli, r: TrailMakingResponse) {
  let errors = 0, completed = 0;
  for (let i = 0; i < r.length; i++) {
    if (r[i] === i) completed++;
    else errors++;
  }
  return { errors, completed };
}
