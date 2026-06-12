import { describe, it, expect } from 'vitest';
import { generate, evaluate, summarize } from '../go-no-go';

describe('go-no-go — generate', () => {
  it('produces the correct total number of trials per level', () => {
    const totals = [20, 25, 30, 35, 40];
    totals.forEach((total, i) => {
      const { stimuli } = generate(i + 1, 42);
      expect(stimuli.trials).toHaveLength(total);
    });
  });

  it('go ratio is approximately correct (±5%)', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = generate(level, 10);
      const goRatios = [0.8, 0.75, 0.7, 0.6, 0.5];
      const expected = goRatios[level - 1] ?? 0.8;
      const actual = stimuli.trials.filter((t) => t.isGo).length / stimuli.trials.length;
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.06);
    }
  });

  it('go trials show goSymbol, no-go trials show noGoSymbol', () => {
    const { stimuli } = generate(2, 7);
    stimuli.trials.forEach((t) => {
      expect(t.symbol).toBe(t.isGo ? stimuli.goSymbol : stimuli.noGoSymbol);
    });
  });

  it('is deterministic with same seed', () => {
    const a = generate(3, 55);
    const b = generate(3, 55);
    expect(a.stimuli.trials.map((t) => t.isGo)).toEqual(b.stimuli.trials.map((t) => t.isGo));
  });
});

describe('go-no-go — evaluate & summarize', () => {
  it('counts hits as correct go responses', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: t.isGo,
      reactionTimeMs: t.isGo ? 350 : 0,
    }));
    const s = summarize(stimuli, response);
    const goCount = stimuli.trials.filter((t) => t.isGo).length;
    expect(s.hits).toBe(goCount);
    expect(s.errors).toBe(0);
  });

  it('counts omissions when go trials not responded to', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: false,
      reactionTimeMs: 0,
    }));
    const s = summarize(stimuli, response);
    const omissions = stimuli.trials.filter((t) => t.isGo).length;
    expect(s.hits).toBe(0);
    expect(s.rawData['omissions']).toBe(omissions);
  });

  it('counts commissions when no-go trials are responded to', () => {
    const { stimuli } = generate(1, 42);
    const response = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: true, // respond to everything
      reactionTimeMs: 300,
    }));
    const s = summarize(stimuli, response);
    const commissions = stimuli.trials.filter((t) => !t.isGo).length;
    expect(s.rawData['commissions']).toBe(commissions);
  });

  it('evaluate returns isCorrect=true only with perfect response', () => {
    const { stimuli } = generate(1, 99);
    const perfectResponse = stimuli.trials.map((t) => ({
      trialId: t.id,
      responded: t.isGo,
      reactionTimeMs: t.isGo ? 400 : 0,
    }));
    const result = evaluate(stimuli, perfectResponse);
    expect(result.isCorrect).toBe(true);
  });
});
