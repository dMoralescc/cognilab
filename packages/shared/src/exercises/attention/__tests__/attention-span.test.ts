import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../attention-span';

describe('attention-span', () => {
  it('generates correct span sizes per level', () => {
    const spans = [3, 4, 5, 6, 8];
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 0);
      expect(stimuli.targetPositions.length).toBe(spans[level - 1]);
    }
  });

  it('target positions are unique and within grid', () => {
    const { stimuli } = generate(3, 99);
    const total = stimuli.gridSize * stimuli.gridSize;
    const unique = new Set(stimuli.targetPositions);
    expect(unique.size).toBe(stimuli.targetPositions.length);
    for (const p of stimuli.targetPositions) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(total);
    }
  });

  it('summarize: exact match → 0 errors', () => {
    const { stimuli } = generate(1, 42);
    const { hits, errors } = summarize(stimuli, [...stimuli.targetPositions]);
    expect(hits).toBe(stimuli.targetPositions.length);
    expect(errors).toBe(0);
  });

  it('summarize: empty response → all omissions', () => {
    const { stimuli } = generate(1, 42);
    const { hits, errors } = summarize(stimuli, []);
    expect(hits).toBe(0);
    expect(errors).toBe(stimuli.targetPositions.length);
  });
});
