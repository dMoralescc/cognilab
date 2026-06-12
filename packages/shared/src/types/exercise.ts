export interface ExerciseContent<T> {
  level: number;
  seed: number;
  timeLimit: number;
  stimuli: T;
}

export interface EvaluationResult {
  isCorrect: boolean;
  reactionTimeMs: number;
  stimulus: unknown;
  response: unknown;
}
