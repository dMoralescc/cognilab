import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface RoutePoint {
  id: number;
  label: string;
  x: number;
  y: number;
  mustVisitBefore?: number;  // constraint: visit this point id before this one
}

export interface RoutePlanningStimuli {
  points: RoutePoint[];
  startId: number;
  constraints: Array<{ before: number; after: number }>;
  timeLimit: number;
}

// Response: ordered list of point ids representing the planned route
export type RoutePlanningResponse = number[];

const PLACE_LABELS = ['Casa','Mercado','Farmacia','Banco','Correos','Hospital','Parque','Colegio','Biblioteca','Estación'];

interface LevelParams { pointCount: number; constraintCount: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { pointCount: 4,  constraintCount: 0, timeLimit: 90 },
  2: { pointCount: 5,  constraintCount: 1, timeLimit: 100 },
  3: { pointCount: 6,  constraintCount: 1, timeLimit: 110 },
  4: { pointCount: 7,  constraintCount: 2, timeLimit: 120 },
  5: { pointCount: 8,  constraintCount: 2, timeLimit: 130 },
};

export function generate(level: number, seed: number): ExerciseContent<RoutePlanningStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const points: RoutePoint[] = Array.from({ length: p.pointCount }, (_, id) => ({
    id,
    label: PLACE_LABELS[id] as string,
    x: 0.1 + rng() * 0.8,
    y: 0.1 + rng() * 0.8,
  }));
  const constraints: Array<{ before: number; after: number }> = [];
  for (let i = 0; i < p.constraintCount; i++) {
    const before = Math.floor(rng() * (p.pointCount - 1)) + 1;
    const after = (before + 1 + Math.floor(rng() * (p.pointCount - 2))) % p.pointCount;
    if (before !== after && before !== 0 && after !== 0) {
      constraints.push({ before, after });
    }
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: { points, startId: 0, constraints, timeLimit: p.timeLimit } };
}

export function evaluate(s: RoutePlanningStimuli, r: RoutePlanningResponse): TrialResult<RoutePlanningStimuli, RoutePlanningResponse> {
  const { constraintsMet, allVisited } = computeMetrics(s, r);
  return { isCorrect: allVisited && constraintsMet === s.constraints.length, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: RoutePlanningStimuli, r: RoutePlanningResponse): ExerciseSummary {
  const { constraintsMet, allVisited } = computeMetrics(s, r);
  const hits = constraintsMet + (allVisited ? 1 : 0);
  const errors = (s.constraints.length - constraintsMet) + (allVisited ? 0 : 1);
  return { hits, errors, reactionTimeMs: null,
    rawData: { constraintsMet, totalConstraints: s.constraints.length, allVisited } };
}

function computeMetrics(s: RoutePlanningStimuli, r: RoutePlanningResponse) {
  const visited = new Set(r);
  const allVisited = s.points.every((p) => visited.has(p.id));
  let constraintsMet = 0;
  for (const c of s.constraints) {
    const bIdx = r.indexOf(c.before), aIdx = r.indexOf(c.after);
    if (bIdx !== -1 && aIdx !== -1 && bIdx < aIdx) constraintsMet++;
  }
  return { constraintsMet, allVisited };
}
