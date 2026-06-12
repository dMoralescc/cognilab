import { describe, it, expect } from 'vitest';
import { generate, summarize } from '../auditory-attention';

describe('auditory-attention', () => {
  it('generates trials with correct target distribution', () => {
    const { stimuli } = generate(1, 0);
    const targets = stimuli.trials.filter((t) => t.isTarget).length;
    expect(targets).toBeGreaterThan(0);
    expect(targets).toBeLessThan(stimuli.trials.length);
  });

  it('target word matches stimuli.targetWord', () => {
    const { stimuli } = generate(2, 77);
    const targetTrials = stimuli.trials.filter((t) => t.isTarget);
    for (const t of targetTrials) {
      expect(t.word).toBe(stimuli.targetWord);
    }
  });

  it('summarize: perfect responses → 0 errors', () => {
    const { stimuli } = generate(1, 10);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: t.isTarget,
      reactionTimeMs: t.isTarget ? 350 : 0,
    }));
    const { hits, errors } = summarize(stimuli, resp);
    expect(errors).toBe(0);
    expect(hits).toBe(stimuli.trials.filter((t) => t.isTarget).length);
  });
});
