import { describe, it, expect } from 'vitest';
import { generate, evaluate, summarize } from '../cancellation';

describe('cancellation — generate', () => {
  it('produces the correct grid size for each level', () => {
    const expected = [5, 7, 9, 10, 12];
    expected.forEach((gridSize, i) => {
      const { stimuli } = generate(i + 1, 42);
      expect(stimuli.gridSize).toBe(gridSize);
      expect(stimuli.symbols).toHaveLength(gridSize * gridSize);
    });
  });

  it('all symbols are either the target or a valid distractor', () => {
    const valid = new Set(['★', '○', '□', '△', '♦', '✦']);
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 99);
      stimuli.symbols.forEach((s) => expect(valid.has(s)).toBe(true));
    }
  });

  it('targetPositions matches actual target positions in symbols array', () => {
    const { stimuli } = generate(3, 7);
    stimuli.targetPositions.forEach((pos) => {
      expect(stimuli.symbols[pos]).toBe('★');
    });
    stimuli.symbols.forEach((sym, i) => {
      if (sym === '★') expect(stimuli.targetPositions).toContain(i);
    });
  });

  it('is deterministic — same seed produces identical output', () => {
    const a = generate(2, 1234);
    const b = generate(2, 1234);
    expect(a.stimuli.symbols).toEqual(b.stimuli.symbols);
    expect(a.stimuli.targetPositions).toEqual(b.stimuli.targetPositions);
  });

  it('produces different grids for different seeds', () => {
    const a = generate(2, 1);
    const b = generate(2, 2);
    expect(a.stimuli.symbols).not.toEqual(b.stimuli.symbols);
  });

  it('only uses the allowed number of distractors per level', () => {
    const allDistractors = ['○', '□', '△', '♦', '✦'];
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 55);
      const usedDistractors = new Set(
        stimuli.symbols.filter((s) => s !== '★'),
      );
      const allowed = new Set(allDistractors.slice(0, level));
      usedDistractors.forEach((d) => expect(allowed.has(d)).toBe(true));
    }
  });
});

describe('cancellation — evaluate', () => {
  it('returns isCorrect=true when all targets hit with no false positives', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.targetPositions.map((position, i) => ({
      position,
      reactionTimeMs: (i + 1) * 500,
    }));
    const result = evaluate(stimuli, response);
    expect(result.isCorrect).toBe(true);
  });

  it('returns isCorrect=false when a target is missed', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.targetPositions.slice(0, -1).map((position, i) => ({
      position,
      reactionTimeMs: (i + 1) * 500,
    }));
    const result = evaluate(stimuli, response);
    expect(result.isCorrect).toBe(false);
  });

  it('returns isCorrect=false when a non-target is tapped', () => {
    const { stimuli } = generate(1, 42);
    const nonTargetPos = stimuli.symbols.findIndex((s, i) => {
      return s !== '★' && !stimuli.targetPositions.includes(i);
    });
    const response = [
      ...stimuli.targetPositions.map((position, i) => ({
        position,
        reactionTimeMs: (i + 1) * 500,
      })),
      { position: nonTargetPos, reactionTimeMs: 9000 },
    ];
    const result = evaluate(stimuli, response);
    expect(result.isCorrect).toBe(false);
  });

  it('reactionTimeMs equals the last tap time', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.targetPositions.map((position, i) => ({
      position,
      reactionTimeMs: (i + 1) * 1000,
    }));
    const result = evaluate(stimuli, response);
    expect(result.reactionTimeMs).toBe(stimuli.targetPositions.length * 1000);
  });

  it('returns 0 reactionTimeMs for empty response', () => {
    const { stimuli } = generate(1, 42);
    const result = evaluate(stimuli, []);
    expect(result.reactionTimeMs).toBe(0);
  });
});

describe('cancellation — summarize', () => {
  it('computes hits, omissions, commissions correctly', () => {
    const { stimuli } = generate(1, 42);
    const totalTargets = stimuli.targetPositions.length;

    const tappedTargets = stimuli.targetPositions.slice(0, -1);
    const nonTarget = stimuli.symbols.findIndex(
      (s, i) => s !== '★' && !stimuli.targetPositions.includes(i),
    );

    const response = [
      ...tappedTargets.map((position, i) => ({ position, reactionTimeMs: i * 500 })),
      { position: nonTarget, reactionTimeMs: 9000 },
    ];

    const summary = summarize(stimuli, response);
    expect(summary.hits).toBe(totalTargets - 1);
    expect(summary.rawData['omissions']).toBe(1);
    expect(summary.rawData['commissions']).toBe(1);
    expect(summary.errors).toBe(2);
  });

  it('reactionTimeMs is null for empty response', () => {
    const { stimuli } = generate(1, 42);
    expect(summarize(stimuli, []).reactionTimeMs).toBeNull();
  });
});
