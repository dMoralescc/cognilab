import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../reaction-time';

describe('reaction-time', () => {
  it('simple RT (level 1-2) has no choice options', () => {
    const { stimuli } = generate(1, 1);
    expect(stimuli.choiceCount).toBe(1);
    for (const t of stimuli.trials) expect(t.choiceIndex).toBeNull();
  });

  it('choice RT (level 5) has 4 options', () => {
    const { stimuli } = generate(5, 1);
    expect(stimuli.choiceCount).toBe(4);
    for (const t of stimuli.trials) {
      expect(t.choiceIndex).not.toBeNull();
      expect(t.choiceIndex).toBeGreaterThanOrEqual(0);
      expect(t.choiceIndex).toBeLessThan(4);
    }
  });

  it('summarize: all correct responses → 0 errors', () => {
    const { stimuli } = generate(1, 5);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: true,
      chosenIndex: null,
      reactionTimeMs: 300,
    }));
    const { hits, errors } = summarize(stimuli, resp);
    expect(hits).toBe(stimuli.trials.length);
    expect(errors).toBe(0);
  });

  it('summarize: anticipations (rt<100) counted as errors', () => {
    const { stimuli } = generate(1, 5);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: true,
      chosenIndex: null,
      reactionTimeMs: 50,
    }));
    const { errors } = summarize(stimuli, resp);
    expect(errors).toBeGreaterThan(0);
  });
});
