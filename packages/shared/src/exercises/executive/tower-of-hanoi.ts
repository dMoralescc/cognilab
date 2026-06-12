import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';

export interface TowerState {
  pegs: number[][];  // peg[i] = stack of disk sizes (largest at index 0)
}

export interface TowerOfHanoiStimuli {
  diskCount: number;
  initialState: TowerState;
  goalPeg: number;     // which peg (0,1,2) disks must end up on
  minMoves: number;    // 2^n - 1
  moveLimit: number;
  timeLimit: number;
}

// Response: sequence of moves [from, to]
export type TowerOfHanoiResponse = Array<[number, number]>;

interface LevelParams { disks: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { disks: 3, timeLimit: 120 },
  2: { disks: 4, timeLimit: 180 },
  3: { disks: 4, timeLimit: 150 },
  4: { disks: 5, timeLimit: 240 },
  5: { disks: 6, timeLimit: 300 },
};

export function generate(level: number, seed: number): ExerciseContent<TowerOfHanoiStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const disks = Array.from({ length: p.disks }, (_, i) => p.disks - i);
  const minMoves = Math.pow(2, p.disks) - 1;
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    diskCount: p.disks,
    initialState: { pegs: [disks, [], []] },
    goalPeg: 2,
    minMoves,
    moveLimit: minMoves * 2,
    timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: TowerOfHanoiStimuli, r: TowerOfHanoiResponse): TrialResult<TowerOfHanoiStimuli, TowerOfHanoiResponse> {
  const { solved, legalMoves } = computeMetrics(s, r);
  void legalMoves;
  return { isCorrect: solved, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: TowerOfHanoiStimuli, r: TowerOfHanoiResponse): ExerciseSummary {
  const { solved, legalMoves, illegalMoves } = computeMetrics(s, r);
  const extraMoves = Math.max(0, legalMoves - s.minMoves);
  return { hits: solved ? 1 : 0, errors: illegalMoves + extraMoves,
    reactionTimeMs: null, rawData: { legalMoves, illegalMoves, extraMoves, minMoves: s.minMoves, solved } };
}

function computeMetrics(s: TowerOfHanoiStimuli, r: TowerOfHanoiResponse) {
  const pegs: number[][] = s.initialState.pegs.map((p) => [...p]);
  let legalMoves = 0, illegalMoves = 0;
  for (const [from, to] of r) {
    const fromPeg = pegs[from], toPeg = pegs[to];
    if (!fromPeg || !toPeg) { illegalMoves++; continue; }
    const disk = fromPeg[fromPeg.length - 1];
    if (disk === undefined) { illegalMoves++; continue; }
    const topTo = toPeg[toPeg.length - 1];
    if (topTo !== undefined && disk > topTo) { illegalMoves++; continue; }
    fromPeg.pop(); toPeg.push(disk); legalMoves++;
  }
  const goalPeg = pegs[s.goalPeg] ?? [];
  const solved = goalPeg.length === s.diskCount &&
    goalPeg.every((d, i) => d === s.diskCount - i);
  return { solved, legalMoves, illegalMoves };
}
