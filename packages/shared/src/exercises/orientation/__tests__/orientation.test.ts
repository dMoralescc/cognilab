import { describe, it, expect } from 'vitest';
import * as temporalOrientation from '../temporal-orientation';
import * as spatialOrientation from '../spatial-orientation';
import * as personalOrientation from '../personal-orientation';
import * as situationalOrientation from '../situational-orientation';

describe('temporalOrientation', () => {
  it('generates questions at each level', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = temporalOrientation.generate(l, 42);
      expect(stimuli.questions.length).toBeGreaterThan(0);
      for (const q of stimuli.questions) expect(q.options).toHaveLength(4);
    }
  });
  it('summarize correct answers', () => {
    const { stimuli } = temporalOrientation.generate(1, 42);
    const responses = stimuli.questions.map(q => ({ questionId: q.id, chosenIndex: q.correctIndex, reactionTimeMs: 2000 }));
    const s = temporalOrientation.summarize(stimuli, responses);
    expect(s.hits).toBe(stimuli.questions.length);
    expect(s.errors).toBe(0);
  });
});

describe('spatialOrientation', () => {
  it('generates questions for each level', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = spatialOrientation.generate(l, 42);
      expect(stimuli.questions.length).toBeGreaterThan(0);
    }
  });
  it('summarize hit on correct', () => {
    const { stimuli } = spatialOrientation.generate(1, 42);
    const q = stimuli.questions[0]!;
    const s = spatialOrientation.summarize(stimuli, [{ questionId: q.id, chosenIndex: q.correctIndex, reactionTimeMs: 3000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('personalOrientation', () => {
  it('generates questions with patient profile', () => {
    const { stimuli } = personalOrientation.generate(1, 42);
    expect(stimuli.questions.length).toBeGreaterThan(0);
    expect(stimuli.patientProfile.name.length).toBeGreaterThan(0);
  });
  it('summarize correct answers', () => {
    const { stimuli } = personalOrientation.generate(2, 42);
    const responses = stimuli.questions.map(q => ({ questionId: q.id, chosenIndex: q.correctIndex, reactionTimeMs: 2500 }));
    const s = personalOrientation.summarize(stimuli, responses);
    expect(s.hits).toBe(stimuli.questions.length);
  });
});

describe('situationalOrientation', () => {
  it('generates questions for all levels', () => {
    for (let l = 1; l <= 5; l++) {
      const { stimuli } = situationalOrientation.generate(l, 42);
      expect(stimuli.questions.length).toBeGreaterThan(0);
    }
  });
  it('summarize hit on correct', () => {
    const { stimuli } = situationalOrientation.generate(1, 42);
    const q = stimuli.questions[0]!;
    const s = situationalOrientation.summarize(stimuli, [{ questionId: q.id, chosenIndex: q.correctIndex, reactionTimeMs: 3000 }]);
    expect(s.hits).toBe(1);
  });
});
