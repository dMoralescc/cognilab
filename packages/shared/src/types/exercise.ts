export interface ExerciseContent<T> {
  level: number;
  seed: number;
  timeLimit: number; // seconds
  stimuli: T;
}

export interface TrialResult<S = unknown, R = unknown> {
  isCorrect: boolean;
  reactionTimeMs: number;
  stimulus: S;
  response: R;
}

// Alias kept for compatibility with CLAUDE.md naming
export type EvaluationResult = TrialResult;

export interface ExerciseSummary {
  hits: number;
  errors: number;
  reactionTimeMs: number | null;
  rawData: Record<string, unknown>;
}
