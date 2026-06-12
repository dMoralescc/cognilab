import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export type FigureElement = { type: 'line' | 'arc' | 'rect'; x: number; y: number; w?: number; h?: number; angle?: number };

export interface FigureStimuli {
  figureId: string;
  figureName: string;
  elements: FigureElement[];
  gridSize: number;
  timeLimit: number;
}

export interface FigureCopyResponse {
  correctElements: number;  // self-reported or scored by clinician
  totalElements: number;
  elapsedMs: number;
}

// Predefined figures with increasing complexity
const FIGURES: { id: string; name: string; elements: FigureElement[]; gridSize: number; level: number }[] = [
  { id: 'square', name: 'Cuadrado', gridSize: 5, level: 1, elements: [
    { type: 'rect', x: 1, y: 1, w: 3, h: 3 },
  ]},
  { id: 'cross', name: 'Cruz', gridSize: 5, level: 2, elements: [
    { type: 'rect', x: 2, y: 0, w: 1, h: 5 },
    { type: 'rect', x: 0, y: 2, w: 5, h: 1 },
  ]},
  { id: 'house', name: 'Casa', gridSize: 6, level: 2, elements: [
    { type: 'rect', x: 1, y: 3, w: 4, h: 3 },
    { type: 'line', x: 3, y: 1, angle: 30 },
    { type: 'line', x: 3, y: 1, angle: 150 },
  ]},
  { id: 'star', name: 'Estrella de 6 puntas', gridSize: 7, level: 3, elements: [
    { type: 'line', x: 1, y: 3, w: 5 },
    { type: 'line', x: 2, y: 1, angle: 60 },
    { type: 'line', x: 4, y: 1, angle: 120 },
  ]},
  { id: 'complex', name: 'Figura de Rey (simplificada)', gridSize: 10, level: 5, elements: [
    { type: 'rect', x: 2, y: 2, w: 6, h: 6 },
    { type: 'line', x: 2, y: 2, w: 6, angle: 45 },
    { type: 'line', x: 8, y: 2, w: 6, angle: 135 },
    { type: 'line', x: 5, y: 0, h: 10 },
    { type: 'line', x: 0, y: 5, w: 10 },
    { type: 'rect', x: 2, y: 0, w: 2, h: 2 },
    { type: 'rect', x: 6, y: 0, w: 2, h: 2 },
  ]},
];

const LEVEL_FIGURE_IDS: Record<number, string> = {
  1: 'square', 2: 'cross', 3: 'house', 4: 'star', 5: 'complex',
};

const TIME_LIMITS: Record<number, number> = { 1: 30, 2: 45, 3: 60, 4: 90, 5: 180 };

export function generate(level: number, _seed: number): ExerciseContent<FigureStimuli> {
  const figId = LEVEL_FIGURE_IDS[level] ?? 'square';
  const fig = FIGURES.find(f => f.id === figId) ?? FIGURES[0]!;
  const timeLimit = TIME_LIMITS[level] ?? 60;
  return { level, seed: _seed, timeLimit, stimuli: { figureId: fig.id, figureName: fig.name, elements: fig.elements, gridSize: fig.gridSize, timeLimit } };
}

export function summarize(_stimuli: FigureStimuli, response: FigureCopyResponse): ExerciseSummary {
  const pct = response.totalElements > 0 ? response.correctElements / response.totalElements : 0;
  return {
    hits: response.correctElements,
    errors: response.totalElements - response.correctElements,
    reactionTimeMs: response.elapsedMs,
    rawData: { totalElements: response.totalElements, percentCorrect: Math.round(pct * 100) },
  };
}
