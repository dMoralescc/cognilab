import { describe, it, expect } from 'vitest';
import * as emotionRecognition from '../emotion-recognition';
import * as theoryOfMind from '../theory-of-mind';
import * as empathy from '../empathy';
import * as perspectiveTaking from '../perspective-taking';
import * as moralCognition from '../moral-cognition';
import * as nonverbalCommunication from '../nonverbal-communication';

describe('emotionRecognition', () => {
  it('generates trials with face emojis', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = emotionRecognition.generate(l, 42);
      expect(stimuli.trials.length).toBeGreaterThan(0);
      for (const t of stimuli.trials) {
        expect(t.options).toContain(t.emotion);
        expect(t.faceEmoji.length).toBeGreaterThan(0);
      }
    }
  });
  it('summarize hit on correct emotion', () => {
    const { stimuli } = emotionRecognition.generate(1, 42);
    const first = stimuli.trials[0]!;
    const s = emotionRecognition.summarize(stimuli, [{ trialId: first.id, chosenEmotion: first.emotion, reactionTimeMs: 1500 }]);
    expect(s.hits).toBe(1);
  });
});

describe('theoryOfMind', () => {
  it('generates scenarios at each level', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = theoryOfMind.generate(l, 42);
      expect(stimuli.scenarios.length).toBeGreaterThan(0);
    }
  });
  it('summarize correct answer', () => {
    const { stimuli } = theoryOfMind.generate(1, 42);
    const s = stimuli.scenarios[0]!;
    const result = theoryOfMind.summarize(stimuli, [{ scenarioId: s.id, chosenIndex: s.correctIndex, reactionTimeMs: 4000 }]);
    expect(result.hits).toBe(1);
  });
});

describe('empathy', () => {
  it('generates scenarios with options', () => {
    const { stimuli } = empathy.generate(1, 42);
    expect(stimuli.scenarios.length).toBeGreaterThan(0);
    for (const s of stimuli.scenarios) expect(s.options).toHaveLength(4);
  });
  it('summarize hit on most empathic response', () => {
    const { stimuli } = empathy.generate(1, 42);
    const s = stimuli.scenarios[0]!;
    const result = empathy.summarize(stimuli, [{ scenarioId: s.id, chosenIndex: s.correctIndex, reactionTimeMs: 3000 }]);
    expect(result.hits).toBe(1);
  });
});

describe('perspectiveTaking', () => {
  it('generates visual trials at level 1', () => {
    const { stimuli } = perspectiveTaking.generate(1, 42);
    expect(stimuli.trials.length).toBeGreaterThan(0);
    for (const t of stimuli.trials) expect(t.type).toBe('visual');
  });
  it('generates mixed types at level 5', () => {
    const { stimuli } = perspectiveTaking.generate(5, 42);
    const types = new Set(stimuli.trials.map(t => t.type));
    expect(types.size).toBeGreaterThanOrEqual(1);
  });
  it('summarize correct answer', () => {
    const { stimuli } = perspectiveTaking.generate(1, 42);
    const t = stimuli.trials[0]!;
    const s = perspectiveTaking.summarize(stimuli, [{ trialId: t.id, chosenIndex: t.correctIndex, reactionTimeMs: 5000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('moralCognition', () => {
  it('generates dilemmas with 4 options', () => {
    const { stimuli } = moralCognition.generate(1, 42);
    expect(stimuli.dilemmas.length).toBeGreaterThan(0);
    for (const d of stimuli.dilemmas) expect(d.options).toHaveLength(4);
  });
  it('summarize hit on correct response', () => {
    const { stimuli } = moralCognition.generate(1, 42);
    const d = stimuli.dilemmas[0]!;
    const s = moralCognition.summarize(stimuli, [{ dilemmaId: d.id, chosenIndex: d.correctIndex, reactionTimeMs: 6000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('nonverbalCommunication', () => {
  it('generates trials with emoji stimuli', () => {
    const { stimuli } = nonverbalCommunication.generate(1, 42);
    expect(stimuli.trials.length).toBeGreaterThan(0);
    for (const t of stimuli.trials) {
      expect(t.emoji.length).toBeGreaterThan(0);
      expect(t.options).toHaveLength(4);
    }
  });
  it('summarize correct answer', () => {
    const { stimuli } = nonverbalCommunication.generate(1, 42);
    const t = stimuli.trials[0]!;
    const s = nonverbalCommunication.summarize(stimuli, [{ trialId: t.id, chosenIndex: t.correctIndex, reactionTimeMs: 2000 }]);
    expect(s.hits).toBe(1);
  });
});
