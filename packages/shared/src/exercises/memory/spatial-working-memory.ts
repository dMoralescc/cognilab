import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface SpatialObject {
  id: number;
  position: number;  // grid cell index
}

export interface SpatialUpdate {
  objectId: number;
  newPosition: number;
}

export interface SpatialWorkingMemoryStimuli {
  initialObjects: SpatialObject[];
  updates: SpatialUpdate[];
  gridSize: number;
  timeLimit: number;
}

// Response: final position for each object id
export type SpatialWorkingMemoryResponse = Array<{ objectId: number; position: number }>;

interface LevelParams { objectCount: number; updateCount: number; gridSize: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { objectCount: 3, updateCount: 0, gridSize: 3, timeLimit: 40 },
  2: { objectCount: 4, updateCount: 1, gridSize: 3, timeLimit: 50 },
  3: { objectCount: 4, updateCount: 2, gridSize: 4, timeLimit: 60 },
  4: { objectCount: 5, updateCount: 3, gridSize: 4, timeLimit: 70 },
  5: { objectCount: 6, updateCount: 4, gridSize: 4, timeLimit: 80 },
};

export function generate(level: number, seed: number): ExerciseContent<SpatialWorkingMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const total = p.gridSize * p.gridSize;
  const positions = Array.from({ length: total }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = positions[i] as number; positions[i] = positions[j] as number; positions[j] = tmp;
  }
  const initialObjects: SpatialObject[] = positions.slice(0, p.objectCount).map((position, id) => ({ id, position }));
  const updates: SpatialUpdate[] = [];
  const current = initialObjects.map((o) => o.position);
  const usedPositions = new Set(current);
  for (let u = 0; u < p.updateCount; u++) {
    const objectId = Math.floor(rng() * p.objectCount);
    let newPos: number;
    do { newPos = Math.floor(rng() * total); } while (usedPositions.has(newPos));
    const oldPos = current[objectId] as number;
    usedPositions.delete(oldPos);
    usedPositions.add(newPos);
    current[objectId] = newPos;
    updates.push({ objectId, newPosition: newPos });
  }
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    initialObjects, updates, gridSize: p.gridSize, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: SpatialWorkingMemoryStimuli, r: SpatialWorkingMemoryResponse): TrialResult<SpatialWorkingMemoryStimuli, SpatialWorkingMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: SpatialWorkingMemoryStimuli, r: SpatialWorkingMemoryResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { objectCount: s.initialObjects.length, updateCount: s.updates.length } };
}

function computeMetrics(s: SpatialWorkingMemoryStimuli, r: SpatialWorkingMemoryResponse) {
  // Compute expected final positions
  const finalPos: Record<number, number> = {};
  for (const o of s.initialObjects) finalPos[o.id] = o.position;
  for (const u of s.updates) finalPos[u.objectId] = u.newPosition;
  const respMap = new Map(r.map((x) => [x.objectId, x.position]));
  let hits = 0, errors = 0;
  for (const [id, pos] of Object.entries(finalPos)) {
    if (respMap.get(Number(id)) === pos) hits++;
    else errors++;
  }
  return { hits, errors };
}
