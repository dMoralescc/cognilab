import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface PuzzlePiece {
  id: number;
  correctRow: number;
  correctCol: number;
  rotation: number;  // degrees: 0, 90, 180, 270
}

export interface PuzzleStimuli {
  imageEmoji: string;
  imageName: string;
  rows: number;
  cols: number;
  pieces: PuzzlePiece[];  // shuffled order
  timeLimit: number;
}

export interface PuzzleResponse {
  placements: { pieceId: number; placedRow: number; placedCol: number }[];
  elapsedMs: number;
}

const IMAGES = [
  { emoji: '🏠', name: 'Casa' },
  { emoji: '🌸', name: 'Flor' },
  { emoji: '🦋', name: 'Mariposa' },
  { emoji: '🐬', name: 'Delfín' },
  { emoji: '🏔️', name: 'Montaña' },
];

interface LevelParams { rows: number; cols: number; rotation: boolean; timeLimit: number }
const LEVELS: LevelParams[] = [
  { rows: 2, cols: 2, rotation: false, timeLimit: 60  },
  { rows: 2, cols: 3, rotation: false, timeLimit: 90  },
  { rows: 3, cols: 3, rotation: false, timeLimit: 120 },
  { rows: 3, cols: 4, rotation: true,  timeLimit: 150 },
  { rows: 5, cols: 5, rotation: true,  timeLimit: 180 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<PuzzleStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const img = IMAGES[Math.floor(rng() * IMAGES.length)] as typeof IMAGES[0];
  const rotations = [0, 90, 180, 270];
  const pieces: PuzzlePiece[] = [];
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const rotation = p.rotation ? (rotations[Math.floor(rng() * 4)] as number) : 0;
      pieces.push({ id: r * p.cols + c, correctRow: r, correctCol: c, rotation });
    }
  }
  const shuffled = shuffle(pieces, rng);
  return { level, seed, timeLimit: p.timeLimit, stimuli: { imageEmoji: img.emoji, imageName: img.name, rows: p.rows, cols: p.cols, pieces: shuffled, timeLimit: p.timeLimit } };
}

export function summarize(stimuli: PuzzleStimuli, response: PuzzleResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.pieces.map(p => [p.id, { row: p.correctRow, col: p.correctCol }]));
  let hits = 0;
  for (const pl of response.placements) {
    const correct = correctMap.get(pl.pieceId);
    if (correct && pl.placedRow === correct.row && pl.placedCol === correct.col) hits++;
  }
  const total = stimuli.pieces.length;
  return { hits, errors: total - hits, reactionTimeMs: response.elapsedMs, rawData: { total } };
}
