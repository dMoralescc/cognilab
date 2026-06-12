import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';

// Design fluency: user draws figures on a dot grid within time limit.
// Since we can't process drawings, we count how many designs the user submits.
export interface DesignFluencyStimuli {
  gridSize: number;         // dots per side (e.g. 4 = 4x4 grid)
  timeLimit: number;
  lineConstraint: 'any' | 'straight' | 'curved'; // allowed line types
  maxDesigns: number;
}

// Response: number of designs submitted (self-reported or counted by player UI)
export type DesignFluencyResponse = { designCount: number; elapsedMs: number };

interface LevelParams { gridSize: number; timeLimit: number; lineConstraint: DesignFluencyStimuli['lineConstraint'] }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { gridSize: 3, timeLimit: 60, lineConstraint: 'any' },
  2: { gridSize: 4, timeLimit: 60, lineConstraint: 'any' },
  3: { gridSize: 4, timeLimit: 60, lineConstraint: 'straight' },
  4: { gridSize: 4, timeLimit: 60, lineConstraint: 'straight' },
  5: { gridSize: 5, timeLimit: 60, lineConstraint: 'curved' },
};

export function generate(level: number, _seed: number): ExerciseContent<DesignFluencyStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli: {
    gridSize: p.gridSize, timeLimit: p.timeLimit, lineConstraint: p.lineConstraint, maxDesigns: 20,
  }};
}

export function evaluate(s: DesignFluencyStimuli, r: DesignFluencyResponse): TrialResult<DesignFluencyStimuli, DesignFluencyResponse> {
  void s;
  return { isCorrect: r.designCount > 0, reactionTimeMs: r.elapsedMs, stimulus: s, response: r };
}

export function summarize(s: DesignFluencyStimuli, r: DesignFluencyResponse): ExerciseSummary {
  void s;
  return { hits: r.designCount, errors: 0, reactionTimeMs: r.elapsedMs,
    rawData: { designCount: r.designCount, timeLimit: s.timeLimit } };
}
