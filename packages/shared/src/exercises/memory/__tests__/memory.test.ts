import { describe, it, expect } from 'vitest';
import * as digitSpan from '../digit-span';
import * as imagePairs from '../image-pairs';
import * as positionSequences from '../position-sequences';
import * as faceMemory from '../face-memory';
import * as wordMemory from '../word-memory';
import * as storyMemory from '../story-memory';
import * as prospectiveMemory from '../prospective-memory';
import * as semanticMemory from '../semantic-memory';
import * as visualRecognition from '../visual-recognition';
import * as spatialWorkingMemory from '../spatial-working-memory';
import * as episodicMemory from '../episodic-memory';
import * as visuospatialSpan from '../visuospatial-span';

describe('digit-span', () => {
  it('backward direction reverses expected answer', () => {
    const { stimuli } = digitSpan.generate(4, 1);
    expect(stimuli.direction).toBe('backward');
    const forward = [...stimuli.sequence];
    const backward = [...stimuli.sequence].reverse();
    const respForward = digitSpan.summarize(stimuli, forward);
    const respBackward = digitSpan.summarize(stimuli, backward);
    expect(respBackward.hits).toBeGreaterThan(respForward.hits);
  });

  it('perfect forward response → 0 errors', () => {
    const { stimuli } = digitSpan.generate(1, 99);
    const { hits, errors } = digitSpan.summarize(stimuli, [...stimuli.sequence]);
    expect(hits).toBe(stimuli.sequence.length);
    expect(errors).toBe(0);
  });
});

describe('image-pairs', () => {
  it('all pairs have unique emojis in pool', () => {
    const { stimuli } = imagePairs.generate(2, 7);
    const all = stimuli.pairs.flatMap((p) => [p.leftEmoji, p.rightEmoji]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('perfect response → 0 errors', () => {
    const { stimuli } = imagePairs.generate(1, 5);
    const resp = stimuli.pairs.map((p) => ({ pairId: p.id, chosen: p.rightEmoji }));
    const { errors } = imagePairs.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('position-sequences', () => {
  it('sequence positions within grid bounds', () => {
    const { stimuli } = positionSequences.generate(3, 0);
    const total = stimuli.gridSize * stimuli.gridSize;
    for (const pos of stimuli.sequence) {
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThan(total);
    }
  });

  it('exact match → 0 errors', () => {
    const { stimuli } = positionSequences.generate(2, 42);
    const { errors } = positionSequences.summarize(stimuli, [...stimuli.sequence]);
    expect(errors).toBe(0);
  });
});

describe('face-memory', () => {
  it('study and test faces don\'t overlap by id', () => {
    const { stimuli } = faceMemory.generate(2, 3);
    const studyIds = new Set(stimuli.studyFaces.map((f) => f.id));
    const nonTargetTest = stimuli.testFaces.filter((f) => !f.isTarget);
    for (const f of nonTargetTest) expect(studyIds.has(f.id)).toBe(false);
  });

  it('selecting all study face ids → 0 errors', () => {
    const { stimuli } = faceMemory.generate(1, 10);
    const ids = stimuli.studyFaces.map((f) => f.id);
    const { errors } = faceMemory.summarize(stimuli, ids);
    expect(errors).toBe(0);
  });
});

describe('word-memory', () => {
  it('study words appear in test words', () => {
    const { stimuli } = wordMemory.generate(1, 0);
    const testSet = new Set(stimuli.testWords);
    for (const w of stimuli.studyWords) expect(testSet.has(w)).toBe(true);
  });

  it('perfect recognition → 0 errors', () => {
    const { stimuli } = wordMemory.generate(2, 5);
    const { errors } = wordMemory.summarize(stimuli, [...stimuli.studyWords]);
    expect(errors).toBe(0);
  });
});

describe('story-memory', () => {
  it('all questions have 4 options', () => {
    const { stimuli } = storyMemory.generate(1, 0);
    for (const q of stimuli.questions) expect(q.options.length).toBe(4);
  });

  it('correct answers → 0 errors', () => {
    const { stimuli } = storyMemory.generate(2, 0);
    const resp = stimuli.questions.map((q) => ({ questionId: q.id, chosen: q.answer }));
    const { errors } = storyMemory.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('prospective-memory', () => {
  it('contains at least one cue trial', () => {
    const { stimuli } = prospectiveMemory.generate(1, 0);
    expect(stimuli.trials.filter((t) => t.isProspectiveCue).length).toBeGreaterThan(0);
  });

  it('responding prospectively on cues → 0 prospective errors', () => {
    const { stimuli } = prospectiveMemory.generate(1, 55);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      mainResponse: t.mainColor,
      prospectiveResponse: t.isProspectiveCue,
      reactionTimeMs: 400,
    }));
    const { rawData } = prospectiveMemory.summarize(stimuli, resp);
    expect(rawData['prospectiveErrors']).toBe(0);
  });
});

describe('semantic-memory', () => {
  it('all answers are one of the options', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = semanticMemory.generate(level, 0);
      for (const q of stimuli.questions) {
        expect(q.options).toContain(q.answer);
      }
    }
  });

  it('correct answers → 0 errors', () => {
    const { stimuli } = semanticMemory.generate(3, 0);
    const resp = stimuli.questions.map((q) => ({ questionId: q.id, chosen: q.answer }));
    const { errors } = semanticMemory.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('visual-recognition', () => {
  it('study items appear in test items', () => {
    const { stimuli } = visualRecognition.generate(2, 0);
    const testIds = new Set(stimuli.testItems.map((it) => it.id));
    for (const it of stimuli.studyItems) expect(testIds.has(it.id)).toBe(true);
  });

  it('selecting all study ids → 0 errors', () => {
    const { stimuli } = visualRecognition.generate(1, 0);
    const ids = stimuli.studyItems.map((it) => it.id);
    const { errors } = visualRecognition.summarize(stimuli, ids);
    expect(errors).toBe(0);
  });
});

describe('spatial-working-memory', () => {
  it('final positions after updates are correct', () => {
    const { stimuli } = spatialWorkingMemory.generate(3, 42);
    const finalPos: Record<number, number> = {};
    for (const o of stimuli.initialObjects) finalPos[o.id] = o.position;
    for (const u of stimuli.updates) finalPos[u.objectId] = u.newPosition;
    const resp = Object.entries(finalPos).map(([id, position]) => ({ objectId: Number(id), position }));
    const { errors } = spatialWorkingMemory.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('episodic-memory', () => {
  it('each event has a location and time', () => {
    const { stimuli } = episodicMemory.generate(3, 0);
    for (const ev of stimuli.events) {
      expect(ev.location).toBeTruthy();
      expect(ev.time).toBeTruthy();
    }
  });

  it('perfect response → 0 errors', () => {
    const { stimuli } = episodicMemory.generate(2, 10);
    const resp = stimuli.events.map((ev) => ({ eventId: ev.id, object: ev.object, location: ev.location, time: ev.time }));
    const { errors } = episodicMemory.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('visuospatial-span', () => {
  it('block count and sequence length per level', () => {
    expect(visuospatialSpan.generate(1, 0).stimuli.blocks.length).toBe(5);
    expect(visuospatialSpan.generate(5, 0).stimuli.sequence.length).toBe(7);
  });

  it('exact sequence replay → 0 errors', () => {
    const { stimuli } = visuospatialSpan.generate(3, 7);
    const { errors } = visuospatialSpan.summarize(stimuli, [...stimuli.sequence]);
    expect(errors).toBe(0);
  });
});
