import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../alternating-attention';

describe('alternating-attention', () => {
  it('generates expected number of trials per level', () => {
    expect(generate(1, 0).stimuli.trials.length).toBe(10);
    expect(generate(5, 0).stimuli.trials.length).toBe(30);
  });

  it('correctResponse matches rule', () => {
    const { stimuli } = generate(3, 55);
    for (const t of stimuli.trials) {
      if (t.rule === 'A') {
        const expected = t.stimulus % 2 === 0 ? 'even' : 'odd';
        expect(t.correctResponse).toBe(expected);
      } else {
        const expected = t.stimulus > 5 ? 'greater' : 'less';
        expect(t.correctResponse).toBe(expected);
      }
    }
  });

  it('summarize: all correct → 0 errors', () => {
    const { stimuli } = generate(1, 10);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      response: t.correctResponse,
      reactionTimeMs: 600,
    }));
    const { hits, errors } = summarize(stimuli, resp);
    expect(hits).toBe(stimuli.trials.length);
    expect(errors).toBe(0);
  });
});
