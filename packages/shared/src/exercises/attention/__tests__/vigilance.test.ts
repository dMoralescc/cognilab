import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../vigilance';

describe('vigilance', () => {
  it('signal rate is approximately correct', () => {
    const { stimuli } = generate(1, 0);
    const signals = stimuli.trials.filter((t) => t.isSignal).length;
    const rate = signals / stimuli.trials.length;
    expect(rate).toBeGreaterThan(0.2);
    expect(rate).toBeLessThan(0.4);
  });

  it('level 5 has fewer signals than level 1', () => {
    const { stimuli: s1 } = generate(1, 0);
    const { stimuli: s5 } = generate(5, 0);
    const rate1 = s1.trials.filter((t) => t.isSignal).length / s1.trials.length;
    const rate5 = s5.trials.filter((t) => t.isSignal).length / s5.trials.length;
    expect(rate5).toBeLessThan(rate1);
  });

  it('summarize: all hits, no false alarms → 0 errors', () => {
    const { stimuli } = generate(1, 42);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: t.isSignal,
      reactionTimeMs: t.isSignal ? 400 : 0,
    }));
    const { hits, errors } = summarize(stimuli, resp);
    expect(errors).toBe(0);
    expect(hits).toBe(stimuli.trials.filter((t) => t.isSignal).length);
  });
});
