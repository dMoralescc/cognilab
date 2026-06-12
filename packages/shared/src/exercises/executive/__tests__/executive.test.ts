import { describe, it, expect } from 'vitest';
import * as stroop from '../stroop';
import * as trailMaking from '../trail-making';
import * as towerOfHanoi from '../tower-of-hanoi';
import * as routePlanning from '../route-planning';
import * as inhibition from '../inhibition';
import * as cognitiveFlexibility from '../cognitive-flexibility';
import * as abstractReasoning from '../abstract-reasoning';
import * as categorization from '../categorization';
import * as problemSolving from '../problem-solving';
import * as designFluency from '../design-fluency';
import * as nBack from '../n-back';
import * as dualTask from '../dual-task';

describe('stroop', () => {
  it('all correct responses → 0 errors', () => {
    const { stimuli } = stroop.generate(3, 42);
    const resp = stimuli.trials.map((t) => ({ trialId: t.id, response: t.correctResponse, reactionTimeMs: 500 }));
    const { errors } = stroop.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });

  it('level 5 has more incongruent trials than level 1', () => {
    const { stimuli: s1 } = stroop.generate(1, 0);
    const { stimuli: s5 } = stroop.generate(5, 0);
    const inc1 = s1.trials.filter((t) => t.type === 'incongruent').length;
    const inc5 = s5.trials.filter((t) => t.type === 'incongruent').length;
    expect(inc5).toBeGreaterThan(inc1);
  });
});

describe('trail-making', () => {
  it('generates correct number of nodes', () => {
    expect(trailMaking.generate(1, 0).stimuli.nodes.length).toBe(10);
    expect(trailMaking.generate(5, 0).stimuli.nodes.length).toBe(25);
  });

  it('version B alternates numbers and letters', () => {
    const { stimuli } = trailMaking.generate(3, 0);
    expect(stimuli.version).toBe('B');
    expect(stimuli.nodes[0]!.label).toBe('1');
    expect(stimuli.nodes[1]!.label).toBe('A');
  });
});

describe('tower-of-hanoi', () => {
  it('level 1 min moves is 7', () => {
    const { stimuli } = towerOfHanoi.generate(1, 0);
    expect(stimuli.minMoves).toBe(7);
  });

  it('optimal 3-disk solution is accepted as solved', () => {
    const { stimuli } = towerOfHanoi.generate(1, 0);
    const moves: Array<[number, number]> = [
      [0,2],[0,1],[2,1],[0,2],[1,0],[1,2],[0,2]
    ];
    const { rawData } = towerOfHanoi.summarize(stimuli, moves);
    expect(rawData['solved']).toBe(true);
    expect(rawData['illegalMoves']).toBe(0);
    expect(rawData['extraMoves']).toBe(0);
  });
});

describe('route-planning', () => {
  it('generates correct point count per level', () => {
    expect(routePlanning.generate(1, 0).stimuli.points.length).toBe(4);
    expect(routePlanning.generate(5, 0).stimuli.points.length).toBe(8);
  });

  it('visiting all points in order meets constraints correctly', () => {
    const { stimuli } = routePlanning.generate(1, 0);
    const route = stimuli.points.map((p) => p.id);
    const { hits } = routePlanning.summarize(stimuli, route);
    expect(hits).toBeGreaterThan(0);
  });
});

describe('inhibition', () => {
  it('has both go and stop trials', () => {
    const { stimuli } = inhibition.generate(1, 0);
    const goTrials = stimuli.trials.filter((t) => !t.hasStopSignal).length;
    const stopTrials = stimuli.trials.filter((t) => t.hasStopSignal).length;
    expect(goTrials).toBeGreaterThan(0);
    expect(stopTrials).toBeGreaterThan(0);
  });

  it('successful inhibition: not responding on stop trials counts as success', () => {
    const { stimuli } = inhibition.generate(1, 0);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id, responded: !t.hasStopSignal, reactionTimeMs: t.hasStopSignal ? 0 : 300,
    }));
    const { rawData } = inhibition.summarize(stimuli, resp);
    expect(rawData['stopErrors']).toBe(0);
  });
});

describe('cognitive-flexibility', () => {
  it('correct responses → 0 errors', () => {
    const { stimuli } = cognitiveFlexibility.generate(2, 5);
    const resp = stimuli.trials.map((t) => ({ trialId: t.id, chosenIndex: t.correctIndex, reactionTimeMs: 600 }));
    const { errors } = cognitiveFlexibility.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('abstract-reasoning', () => {
  it('each trial has 4 options', () => {
    const { stimuli } = abstractReasoning.generate(2, 0);
    for (const t of stimuli.trials) expect(t.options.length).toBe(4);
  });

  it('correct index is within 0-3', () => {
    const { stimuli } = abstractReasoning.generate(3, 7);
    for (const t of stimuli.trials) {
      expect(t.correctIndex).toBeGreaterThanOrEqual(0);
      expect(t.correctIndex).toBeLessThan(4);
    }
  });
});

describe('categorization', () => {
  it('odd item is not in the category members', () => {
    const { stimuli } = categorization.generate(1, 0);
    for (const t of stimuli.trials) {
      const odd = t.items[t.oddIndex]!;
      // The other 3 items should not include the odd one
      const rest = t.items.filter((_, i) => i !== t.oddIndex);
      expect(rest.includes(odd)).toBe(false);
    }
  });

  it('correct answer → 0 errors', () => {
    const { stimuli } = categorization.generate(2, 3);
    const resp = stimuli.trials.map((t) => ({ trialId: t.id, chosenIndex: t.oddIndex, reactionTimeMs: 500 }));
    const { errors } = categorization.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('problem-solving', () => {
  it('best option is always within options array', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = problemSolving.generate(level, 0);
      for (const sc of stimuli.scenarios) {
        expect(sc.bestOptionIndex).toBeGreaterThanOrEqual(0);
        expect(sc.bestOptionIndex).toBeLessThan(sc.options.length);
      }
    }
  });

  it('optimal choices → 0 errors', () => {
    const { stimuli } = problemSolving.generate(1, 0);
    const resp = stimuli.scenarios.map((sc) => ({ scenarioId: sc.id, chosenIndex: sc.bestOptionIndex }));
    const { errors } = problemSolving.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('design-fluency', () => {
  it('generates valid stimuli for all levels', () => {
    for (let level = 1; level <= 5; level++) {
      const { stimuli } = designFluency.generate(level, 0);
      expect(stimuli.timeLimit).toBeGreaterThan(0);
      expect(stimuli.gridSize).toBeGreaterThan(0);
    }
  });

  it('summarize returns design count as hits', () => {
    const { stimuli } = designFluency.generate(1, 0);
    const { hits } = designFluency.summarize(stimuli, { designCount: 7, elapsedMs: 55000 });
    expect(hits).toBe(7);
  });
});

describe('n-back', () => {
  it('has n-back targets in sequence', () => {
    const { stimuli } = nBack.generate(3, 0);
    expect(stimuli.n).toBe(2);
    const targets = stimuli.trials.filter((t) => t.isTarget);
    expect(targets.length).toBeGreaterThan(0);
  });

  it('all correct responses → 0 errors', () => {
    const { stimuli } = nBack.generate(1, 42);
    const resp = stimuli.trials.map((t) => ({ trialId: t.id, responded: t.isTarget, reactionTimeMs: t.isTarget ? 400 : 0 }));
    const { errors } = nBack.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});

describe('dual-task', () => {
  it('correct dual responses → 0 errors', () => {
    const { stimuli } = dualTask.generate(1, 0);
    const resp = stimuli.trials.map((t) => ({
      trialId: t.id,
      colorResponse: t.correctColor,
      parityResponse: t.correctParity,
      reactionTimeMs: 500,
    }));
    const { errors } = dualTask.summarize(stimuli, resp);
    expect(errors).toBe(0);
  });
});
