import { describe, it, expect } from 'vitest';
import * as mentalRotation from '../mental-rotation';
import * as figureCopy from '../figure-copy';
import * as puzzle from '../puzzle';
import * as maze from '../maze';
import * as depthPerception from '../depth-perception';
import * as objectAssembly from '../object-assembly';
import * as shapeDiscrimination from '../shape-discrimination';
import * as lineOrientation from '../line-orientation';

describe('mentalRotation', () => {
  it('generates trials at each level', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = mentalRotation.generate(l, 42);
      expect(stimuli.trials.length).toBeGreaterThan(0);
      for (const t of stimuli.trials) {
        expect(['same', 'mirror']).toContain(t.correctAnswer);
      }
    }
  });
  it('summarize hit on correct answer', () => {
    const { stimuli } = mentalRotation.generate(1, 42);
    const first = stimuli.trials[0]!;
    const s = mentalRotation.summarize(stimuli, [{ trialId: first.id, answer: first.correctAnswer, reactionTimeMs: 1500 }]);
    expect(s.hits).toBe(1);
    expect(s.errors).toBe(0);
  });
});

describe('figureCopy', () => {
  it('generates figure for each level', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = figureCopy.generate(l, 42);
      expect(stimuli.elements.length).toBeGreaterThan(0);
    }
  });
  it('summarize correct response', () => {
    const { stimuli } = figureCopy.generate(1, 42);
    const s = figureCopy.summarize(stimuli, { correctElements: 1, totalElements: 1, elapsedMs: 20000 });
    expect(s.hits).toBe(1);
    expect(s.errors).toBe(0);
  });
});

describe('puzzle', () => {
  it('generates pieces equal to rows*cols', () => {
    const { stimuli } = puzzle.generate(1, 42);
    expect(stimuli.pieces.length).toBe(stimuli.rows * stimuli.cols);
  });
  it('summarize correct placement', () => {
    const { stimuli } = puzzle.generate(1, 42);
    const placements = stimuli.pieces.map(p => ({ pieceId: p.id, placedRow: p.correctRow, placedCol: p.correctCol }));
    const s = puzzle.summarize(stimuli, { placements, elapsedMs: 30000 });
    expect(s.hits).toBe(stimuli.pieces.length);
    expect(s.errors).toBe(0);
  });
});

describe('maze', () => {
  it('generates a solvable maze with start and end', () => {
    const { stimuli } = maze.generate(1, 42);
    expect(stimuli.start).toEqual({ row: 0, col: 0 });
    expect(stimuli.end.row).toBeGreaterThan(0);
    expect(stimuli.solution.length).toBeGreaterThan(1);
  });
  it('summarize completed maze', () => {
    const { stimuli } = maze.generate(1, 42);
    const s = maze.summarize(stimuli, { path: [...stimuli.solution, stimuli.end], elapsedMs: 20000, errors: 2 });
    expect(s.hits).toBe(1);
  });
  it('summarize incomplete maze', () => {
    const { stimuli } = maze.generate(1, 42);
    const s = maze.summarize(stimuli, { path: [{ row: 0, col: 0 }], elapsedMs: 5000, errors: 0 });
    expect(s.hits).toBe(0);
  });
});

describe('depthPerception', () => {
  it('generates items with objects', () => {
    const { stimuli } = depthPerception.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) {
      expect(it.objects.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('summarize correct order', () => {
    const { stimuli } = depthPerception.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = depthPerception.summarize(stimuli, [{ itemId: first.id, chosenOrder: first.correctOrder, reactionTimeMs: 3000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('objectAssembly', () => {
  it('generates items with parts', () => {
    const { stimuli } = objectAssembly.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) expect(it.parts.length).toBeGreaterThan(0);
  });
  it('summarize identified as hit', () => {
    const { stimuli } = objectAssembly.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = objectAssembly.summarize(stimuli, [{ itemId: first.id, identified: true, reactionTimeMs: 5000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('shapeDiscrimination', () => {
  it('generates trials with 4 options', () => {
    const { stimuli } = shapeDiscrimination.generate(1, 42);
    expect(stimuli.trials.length).toBeGreaterThan(0);
    for (const t of stimuli.trials) expect(t.options).toHaveLength(4);
  });
  it('summarize correct choice', () => {
    const { stimuli } = shapeDiscrimination.generate(1, 42);
    const first = stimuli.trials[0]!;
    const s = shapeDiscrimination.summarize(stimuli, [{ trialId: first.id, chosenIndex: first.correctIndex, reactionTimeMs: 1500 }]);
    expect(s.hits).toBe(1);
  });
});

describe('lineOrientation', () => {
  it('generates trials with reference angles', () => {
    const { stimuli } = lineOrientation.generate(1, 42);
    expect(stimuli.trials.length).toBeGreaterThan(0);
    for (const t of stimuli.trials) {
      expect(t.referenceAngles.length).toBeGreaterThan(0);
      expect(t.correctIndices.length).toBeGreaterThan(0);
    }
  });
  it('summarize correct selection', () => {
    const { stimuli } = lineOrientation.generate(1, 42);
    const first = stimuli.trials[0]!;
    const s = lineOrientation.summarize(stimuli, [{ trialId: first.id, chosenIndices: first.correctIndices, reactionTimeMs: 3000 }]);
    expect(s.hits).toBe(1);
  });
});
