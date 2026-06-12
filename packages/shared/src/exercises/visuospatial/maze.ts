import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface Cell { row: number; col: number }
export interface Wall { from: Cell; to: Cell }

export interface MazeStimuli {
  rows: number;
  cols: number;
  walls: Wall[];       // walls to render
  start: Cell;
  end: Cell;
  solution: Cell[];    // optimal path
  timeLimit: number;
}

export interface MazeResponse {
  path: Cell[];        // path taken by user
  elapsedMs: number;
  errors: number;      // retrograde movements
}

interface LevelParams { rows: number; cols: number; timeLimit: number }
const LEVELS: LevelParams[] = [
  { rows: 5,  cols: 5,  timeLimit: 60  },
  { rows: 7,  cols: 7,  timeLimit: 90  },
  { rows: 9,  cols: 9,  timeLimit: 120 },
  { rows: 11, cols: 11, timeLimit: 150 },
  { rows: 15, cols: 15, timeLimit: 180 },
];

function key(r: number, c: number) { return `${r},${c}`; }

export function generate(level: number, seed: number): ExerciseContent<MazeStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const { rows, cols } = p;

  // Recursive backtracker maze generation
  const visited = new Set<string>();
  const walls: Wall[] = [];

  // Initialize: all walls present between cells
  const passages = new Set<string>(); // "r1,c1->r2,c2"

  const stack: Cell[] = [{ row: 0, col: 0 }];
  visited.add(key(0, 0));

  const dirs: Cell[] = [{ row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 }];

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const neighbors = dirs
      .map(d => ({ row: cur.row + d.row, col: cur.col + d.col }))
      .filter(n => n.row >= 0 && n.row < rows && n.col >= 0 && n.col < cols && !visited.has(key(n.row, n.col)));

    if (neighbors.length === 0) { stack.pop(); continue; }

    const next = neighbors[Math.floor(rng() * neighbors.length)] as Cell;
    visited.add(key(next.row, next.col));
    passages.add(`${key(cur.row, cur.col)}->${key(next.row, next.col)}`);
    passages.add(`${key(next.row, next.col)}->${key(cur.row, cur.col)}`);
    stack.push(next);
  }

  // Build walls from missing passages
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Check right neighbor
      if (c + 1 < cols && !passages.has(`${key(r, c)}->${key(r, c + 1)}`)) {
        walls.push({ from: { row: r, col: c }, to: { row: r, col: c + 1 } });
      }
      // Check bottom neighbor
      if (r + 1 < rows && !passages.has(`${key(r, c)}->${key(r + 1, c)}`)) {
        walls.push({ from: { row: r, col: c }, to: { row: r + 1, col: c } });
      }
    }
  }

  // BFS for solution
  const start: Cell = { row: 0, col: 0 };
  const end: Cell = { row: rows - 1, col: cols - 1 };
  const bfsQueue: Cell[] = [start];
  const parent = new Map<string, Cell | null>();
  parent.set(key(start.row, start.col), null);

  while (bfsQueue.length) {
    const cur = bfsQueue.shift()!;
    if (cur.row === end.row && cur.col === end.col) break;
    for (const d of dirs) {
      const next = { row: cur.row + d.row, col: cur.col + d.col };
      const nk = key(next.row, next.col);
      if (next.row < 0 || next.row >= rows || next.col < 0 || next.col >= cols) continue;
      if (parent.has(nk)) continue;
      if (!passages.has(`${key(cur.row, cur.col)}->${nk}`)) continue;
      parent.set(nk, cur);
      bfsQueue.push(next);
    }
  }

  // Reconstruct solution path
  const solution: Cell[] = [];
  let cur: Cell | null | undefined = end;
  while (cur) {
    solution.unshift(cur);
    cur = parent.get(key(cur.row, cur.col));
  }

  return { level, seed, timeLimit: p.timeLimit, stimuli: { rows, cols, walls, start, end, solution, timeLimit: p.timeLimit } };
}

export function summarize(stimuli: MazeStimuli, response: MazeResponse): ExerciseSummary {
  const reached = response.path.some(c => c.row === stimuli.end.row && c.col === stimuli.end.col);
  return {
    hits: reached ? 1 : 0,
    errors: response.errors,
    reactionTimeMs: response.elapsedMs,
    rawData: { pathLength: response.path.length, optimalLength: stimuli.solution.length, completed: reached },
  };
}
