import { describe, it, expect } from 'vitest';
import * as phonologicalFluency from '../phonological-fluency';
import * as semanticFluency from '../semantic-fluency';
import * as naming from '../naming';
import * as comprehension from '../comprehension';
import * as repetition from '../repetition';
import * as reading from '../reading';
import * as writing from '../writing';
import * as prosody from '../prosody';

describe('phonologicalFluency', () => {
  it('generates level 1 with letter M and 90s', () => {
    const { stimuli, timeLimit } = phonologicalFluency.generate(1, 42);
    expect(stimuli.letter).toBe('M');
    expect(timeLimit).toBe(90);
  });
  it('summarize counts only words starting with letter', () => {
    const { stimuli } = phonologicalFluency.generate(1, 42);
    const s = phonologicalFluency.summarize(stimuli, { words: ['mesa', 'mar', 'sol', 'mesa'], elapsedMs: 30000 });
    expect(s.hits).toBe(2);    // mesa, mar (unique, start with m)
    expect(s.errors).toBe(2); // sol (intrusion) + mesa repeat (perseveration)
  });
});

describe('semanticFluency', () => {
  it('generates level 1 with animales category', () => {
    const { stimuli } = semanticFluency.generate(1, 42);
    expect(stimuli.category).toBe('animales');
    expect(stimuli.timeLimit).toBe(90);
  });
  it('summarize counts unique words', () => {
    const { stimuli } = semanticFluency.generate(1, 42);
    const s = semanticFluency.summarize(stimuli, { words: ['perro', 'gato', 'perro'], elapsedMs: 20000 });
    expect(s.hits).toBe(2);
    expect(s.errors).toBe(1); // 1 perseveration
  });
});

describe('naming', () => {
  it('generates items with 4 options each', () => {
    const { stimuli } = naming.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThanOrEqual(3);
    for (const it of stimuli.items) {
      expect(it.options).toHaveLength(4);
      expect(it.options).toContain(it.correctName);
    }
  });
  it('summarize hit on correct response', () => {
    const { stimuli } = naming.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = naming.summarize(stimuli, [{ itemId: first.id, response: first.correctName, reactionTimeMs: 1000 }]);
    expect(s.hits).toBe(1);
    expect(s.errors).toBe(0);
  });
});

describe('comprehension', () => {
  it('generates level 1 items', () => {
    const { stimuli } = comprehension.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) expect(it.options).toHaveLength(4);
  });
  it('summarize correct/incorrect', () => {
    const { stimuli } = comprehension.generate(1, 42);
    const first = stimuli.items[0]!;
    const correct = comprehension.summarize(stimuli, [{ itemId: first.id, chosenIndex: first.correctIndex, reactionTimeMs: 2000 }]);
    expect(correct.hits).toBe(1);
    const wrong = comprehension.summarize(stimuli, [{ itemId: first.id, chosenIndex: (first.correctIndex + 1) % 4, reactionTimeMs: 2000 }]);
    expect(wrong.errors).toBe(1);
  });
});

describe('repetition', () => {
  it('generates items at level 1', () => {
    const { stimuli } = repetition.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) expect(it.type).toBe('word');
  });
  it('summarize exact match as hit', () => {
    const { stimuli } = repetition.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = repetition.summarize(stimuli, [{ itemId: first.id, typed: first.text, reactionTimeMs: 1500 }]);
    expect(s.hits).toBe(1);
  });
  it('summarize accent-insensitive match', () => {
    const { stimuli } = repetition.generate(2, 42);
    const item = stimuli.items.find(it => it.text === 'lámpara') ?? stimuli.items[0]!;
    const s = repetition.summarize(stimuli, [{ itemId: item.id, typed: 'lampara', reactionTimeMs: 2000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('reading', () => {
  it('generates passage with questions', () => {
    const { stimuli } = reading.generate(1, 42);
    expect(stimuli.text.length).toBeGreaterThan(20);
    expect(stimuli.questions.length).toBeGreaterThan(0);
  });
  it('summarize correct answer', () => {
    const { stimuli } = reading.generate(1, 42);
    const q = stimuli.questions[0]!;
    const s = reading.summarize(stimuli, [{ questionId: q.id, chosenIndex: q.correctIndex, reactionTimeMs: 3000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('writing', () => {
  it('generates items at level 1', () => {
    const { stimuli } = writing.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) expect(it.taskType).toBe('dictation');
  });
  it('summarize exact match as hit', () => {
    const { stimuli } = writing.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = writing.summarize(stimuli, [{ itemId: first.id, typed: first.text, reactionTimeMs: 2000 }]);
    expect(s.hits).toBe(1);
  });
});

describe('prosody', () => {
  it('generates items with emotion options', () => {
    const { stimuli } = prosody.generate(1, 42);
    expect(stimuli.items.length).toBeGreaterThan(0);
    for (const it of stimuli.items) {
      expect(it.options).toContain(it.emotion);
      expect(it.options.length).toBeGreaterThanOrEqual(4);
    }
  });
  it('summarize hit on correct emotion', () => {
    const { stimuli } = prosody.generate(1, 42);
    const first = stimuli.items[0]!;
    const s = prosody.summarize(stimuli, [{ itemId: first.id, chosenEmotion: first.emotion, reactionTimeMs: 1800 }]);
    expect(s.hits).toBe(1);
  });
});
