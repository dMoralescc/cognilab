import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface VisualSearchItem {
  id: number;
  symbol: string;
  x: number; // 0–90 percentage of container width
  y: number; // 0–90 percentage of container height
  isTarget: boolean;
}

export interface VisualSearchStimuli {
  items: VisualSearchItem[];
  target: string;
  timeLimit: number;
}

export interface VisualSearchResponse {
  selectedId: number | null;
  reactionTimeMs: number;
}

const TARGET = '◉';
const DISTRACTORS = ['△', '□', '⬡', '♦', '○'];

interface LevelParams {
  itemCount: number;
  distractorCount: number;
  timeLimit: number;
}

const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { itemCount: 10, distractorCount: 1, timeLimit: 30 },
  2: { itemCount: 15, distractorCount: 2, timeLimit: 40 },
  3: { itemCount: 22, distractorCount: 3, timeLimit: 50 },
  4: { itemCount: 30, distractorCount: 4, timeLimit: 60 },
  5: { itemCount: 40, distractorCount: 5, timeLimit: 75 },
};

function gridPositions(n: number, rng: () => number): Array<{ x: number; y: number }> {
  const cols = Math.ceil(Math.sqrt(n * 1.3));
  const rows = Math.ceil(n / cols);
  const cellW = 90 / cols;
  const cellH = 90 / rows;
  const cells = Array.from({ length: cols * rows }, (_, i) => i);

  // Fisher-Yates shuffle to pick n cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cells[i] as number;
    cells[i] = cells[j] as number;
    cells[j] = tmp;
  }

  return cells.slice(0, n).map((cell) => {
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    const jitterX = rng() * cellW * 0.6;
    const jitterY = rng() * cellH * 0.6;
    return {
      x: Math.min(col * cellW + jitterX, 88),
      y: Math.min(row * cellH + jitterY, 88),
    };
  });
}

export function generate(
  level: number,
  seed: number,
): ExerciseContent<VisualSearchStimuli> {
  const params = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const available = DISTRACTORS.slice(0, params.distractorCount);
  const positions = gridPositions(params.itemCount, rng);
  const targetIdx = Math.floor(rng() * params.itemCount);

  const items: VisualSearchItem[] = positions.map((pos, i) => {
    const isTarget = i === targetIdx;
    const symbol = isTarget
      ? TARGET
      : (available[Math.floor(rng() * available.length)] ?? '□');
    return { id: i, symbol, x: pos.x, y: pos.y, isTarget };
  });

  return {
    level,
    seed,
    timeLimit: params.timeLimit,
    stimuli: { items, target: TARGET, timeLimit: params.timeLimit },
  };
}

export function evaluate(
  stimuli: VisualSearchStimuli,
  response: VisualSearchResponse,
): TrialResult<VisualSearchStimuli, VisualSearchResponse> {
  const selected = stimuli.items.find((it) => it.id === response.selectedId);
  return {
    isCorrect: selected?.isTarget === true,
    reactionTimeMs: response.reactionTimeMs,
    stimulus: stimuli,
    response,
  };
}

export function summarize(
  stimuli: VisualSearchStimuli,
  response: VisualSearchResponse,
): ExerciseSummary {
  const selected = stimuli.items.find((it) => it.id === response.selectedId);
  const isCorrect = selected?.isTarget === true;
  return {
    hits: isCorrect ? 1 : 0,
    errors: isCorrect ? 0 : 1,
    reactionTimeMs: response.reactionTimeMs,
    rawData: {
      selectedId: response.selectedId,
      totalItems: stimuli.items.length,
    },
  };
}
