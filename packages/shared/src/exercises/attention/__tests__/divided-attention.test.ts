import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../divided-attention';

describe('divided-attention', () => {
  it('generates the correct number of trials', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 42);
      expect(stimuli.trials.length).toBeGreaterThan(0);
    }
  });

  it('each trial has correct color and parity', () => {
    const { stimuli } = generate(1, 99);
    for (const t of stimuli.trials) {
      expect(['red', 'blue']).toContain(t.correctColor);
      expect(t.correctColor).toBe(t.colorLabel);
      const expected = t.number % 2 === 0 ? 'even' : 'odd';
      expect(t.correctParity).toBe(expected);
    }
  });

  it('summarize returns hits=2*total when all answers correct', () => {
    const { stimuli } = generate(1, 7);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      colorResponse: t.correctColor,
      parityResponse: t.correctParity,
      reactionTimeMs: 500,
    }));
    const { hits, errors } = summarize(stimuli, resp);
    expect(hits).toBe(stimuli.trials.length * 2);
    expect(errors).toBe(0);
  });

  it('summarize returns errors when answers are wrong', () => {
    const { stimuli } = generate(1, 7);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      colorResponse: null as null,
      parityResponse: null as null,
      reactionTimeMs: 0,
    }));
    const { errors } = summarize(stimuli, resp);
    expect(errors).toBe(stimuli.trials.length * 2);
  });
});
