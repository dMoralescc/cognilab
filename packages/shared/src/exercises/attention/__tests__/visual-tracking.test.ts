import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../visual-tracking';

describe('visual-tracking', () => {
  it('generates correct target count per level', () => {
    const expected = [1, 2, 2, 3, 4];
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 0);
      const targets = stimuli.objects.filter((o) => o.isTarget).length;
      expect(targets).toBe(expected[level - 1]);
      expect(stimuli.targetCount).toBe(expected[level - 1]);
    }
  });

  it('objects have valid initial positions', () => {
    const { stimuli } = generate(3, 42);
    for (const o of stimuli.objects) {
      expect(o.x).toBeGreaterThanOrEqual(0);
      expect(o.x).toBeLessThanOrEqual(1);
      expect(o.y).toBeGreaterThanOrEqual(0);
      expect(o.y).toBeLessThanOrEqual(1);
    }
  });

  it('summarize: selecting all target ids → 0 errors', () => {
    const { stimuli } = generate(1, 99);
    const targetIds = stimuli.objects.filter((o) => o.isTarget).map((o) => o.id);
    const { hits, errors } = summarize(stimuli, targetIds);
    expect(hits).toBe(stimuli.targetCount);
    expect(errors).toBe(0);
  });

  it('summarize: empty selection → all errors', () => {
    const { stimuli } = generate(1, 99);
    const { hits, errors } = summarize(stimuli, []);
    expect(hits).toBe(0);
    expect(errors).toBe(stimuli.targetCount);
  });
});
