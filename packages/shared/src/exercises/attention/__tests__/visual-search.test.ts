import { describe, it, expect } from 'vitest';
import { generate, evaluate, summarize } from '../visual-search';

describe('visual-search — generate', () => {
  it('contains exactly the requested number of items', () => {
    const counts = [10, 15, 22, 30, 40];
    counts.forEach((count, i) => {
      const { stimuli } = generate(i + 1, 42);
      expect(stimuli.items).toHaveLength(count);
    });
  });

  it('has exactly one target', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 7);
      expect(stimuli.items.filter((it) => it.isTarget)).toHaveLength(1);
    }
  });

  it('target symbol matches the stimuli.target field', () => {
    const { stimuli } = generate(2, 99);
    const target = stimuli.items.find((it) => it.isTarget);
    expect(target?.symbol).toBe(stimuli.target);
  });

  it('all positions are within 0–90 bounds', () => {
    const { stimuli } = generate(5, 1);
    stimuli.items.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(90);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(90);
    });
  });

  it('is deterministic with same seed', () => {
    const a = generate(3, 123);
    const b = generate(3, 123);
    expect(a.stimuli.items).toEqual(b.stimuli.items);
  });

  it('produces different layouts with different seeds', () => {
    const a = generate(3, 1);
    const b = generate(3, 2);
    const aPos = a.stimuli.items.map((it) => it.x + it.y);
    const bPos = b.stimuli.items.map((it) => it.x + it.y);
    expect(aPos).not.toEqual(bPos);
  });
});

describe('visual-search — evaluate', () => {
  it('returns isCorrect=true when target is selected', () => {
    const { stimuli } = generate(1, 42);
    const target = stimuli.items.find((it) => it.isTarget)!;
    const result = evaluate(stimuli, { selectedId: target.id, reactionTimeMs: 1200 });
    expect(result.isCorrect).toBe(true);
    expect(result.reactionTimeMs).toBe(1200);
  });

  it('returns isCorrect=false when a distractor is selected', () => {
    const { stimuli } = generate(1, 42);
    const distractor = stimuli.items.find((it) => !it.isTarget)!;
    const result = evaluate(stimuli, { selectedId: distractor.id, reactionTimeMs: 800 });
    expect(result.isCorrect).toBe(false);
  });

  it('returns isCorrect=false when nothing selected', () => {
    const { stimuli } = generate(1, 42);
    const result = evaluate(stimuli, { selectedId: null, reactionTimeMs: 30000 });
    expect(result.isCorrect).toBe(false);
  });
});

describe('visual-search — summarize', () => {
  it('returns hits=1 errors=0 for correct response', () => {
    const { stimuli } = generate(2, 10);
    const target = stimuli.items.find((it) => it.isTarget)!;
    const s = summarize(stimuli, { selectedId: target.id, reactionTimeMs: 2000 });
    expect(s.hits).toBe(1);
    expect(s.errors).toBe(0);
    expect(s.reactionTimeMs).toBe(2000);
  });

  it('returns hits=0 errors=1 for wrong response', () => {
    const { stimuli } = generate(2, 10);
    const distractor = stimuli.items.find((it) => !it.isTarget)!;
    const s = summarize(stimuli, { selectedId: distractor.id, reactionTimeMs: 5000 });
    expect(s.hits).toBe(0);
    expect(s.errors).toBe(1);
  });
});
