import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Wisconsin Card Sorting-inspired: classify cards by color or shape
export interface FlexibilityCard {
  color: 'red' | 'blue' | 'green' | 'yellow';
  shape: 'circle' | 'square' | 'triangle' | 'star';
  count: 1 | 2 | 3;
}

export type FlexibilityRule = 'color' | 'shape' | 'count';

export interface FlexibilityTrial {
  id: number;
  card: FlexibilityCard;
  referenceCards: FlexibilityCard[];  // 4 reference options
  currentRule: FlexibilityRule;
  showRule: boolean;  // explicit rule hint at lower levels
  correctIndex: number;  // which referenceCards index matches by currentRule
}

export interface CognitiveFlexibilityStimuli {
  trials: FlexibilityTrial[];
  timeLimit: number;
}

export interface FlexibilityTrialResponse {
  trialId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type CognitiveFlexibilityResponse = FlexibilityTrialResponse[];

const COLORS: FlexibilityCard['color'][] = ['red', 'blue', 'green', 'yellow'];
const SHAPES: FlexibilityCard['shape'][] = ['circle', 'square', 'triangle', 'star'];
const COUNTS: Array<1|2|3> = [1, 2, 3];

interface LevelParams { trials: number; rules: FlexibilityRule[]; switchFreq: number; showRule: boolean; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 12, rules: ['color','shape'],         switchFreq: 4, showRule: true,  timeLimit: 90 },
  2: { trials: 16, rules: ['color','shape'],         switchFreq: 3, showRule: true,  timeLimit: 90 },
  3: { trials: 20, rules: ['color','shape','count'], switchFreq: 4, showRule: false, timeLimit: 90 },
  4: { trials: 24, rules: ['color','shape','count'], switchFreq: 3, showRule: false, timeLimit: 100 },
  5: { trials: 30, rules: ['color','shape','count'], switchFreq: 2, showRule: false, timeLimit: 110 },
};

function randomCard(rng: () => number): FlexibilityCard {
  return {
    color: COLORS[Math.floor(rng() * COLORS.length)] as FlexibilityCard['color'],
    shape: SHAPES[Math.floor(rng() * SHAPES.length)] as FlexibilityCard['shape'],
    count: COUNTS[Math.floor(rng() * COUNTS.length)] as 1|2|3,
  };
}

export function generate(level: number, seed: number): ExerciseContent<CognitiveFlexibilityStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  let currentRule = p.rules[0] as FlexibilityRule;
  let sinceSwitch = 0;
  const trials: FlexibilityTrial[] = Array.from({ length: p.trials }, (_, id) => {
    if (id > 0 && sinceSwitch >= p.switchFreq && rng() < 0.5) {
      const others = p.rules.filter((r) => r !== currentRule);
      currentRule = others[Math.floor(rng() * others.length)] as FlexibilityRule;
      sinceSwitch = 0;
    }
    sinceSwitch++;
    const card = randomCard(rng);
    // Build reference cards: one matches by rule, three are distractors
    const refs: FlexibilityCard[] = [randomCard(rng), randomCard(rng), randomCard(rng), randomCard(rng)];
    const correctIdx = Math.floor(rng() * 4);
    // Force the correct reference to match the rule
    const match = { ...randomCard(rng) };
    if (currentRule === 'color') match.color = card.color;
    else if (currentRule === 'shape') match.shape = card.shape;
    else match.count = card.count;
    refs[correctIdx] = match;
    return { id, card, referenceCards: refs, currentRule, showRule: p.showRule, correctIndex: correctIdx };
  });
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, timeLimit: p.timeLimit } };
}

export function evaluate(s: CognitiveFlexibilityStimuli, r: CognitiveFlexibilityResponse): TrialResult<CognitiveFlexibilityStimuli, CognitiveFlexibilityResponse> {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: CognitiveFlexibilityStimuli, r: CognitiveFlexibilityResponse): ExerciseSummary {
  const { hits, errors, meanRt } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: meanRt, rawData: { totalTrials: s.trials.length } };
}

function computeMetrics(s: CognitiveFlexibilityStimuli, r: CognitiveFlexibilityResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, errors = 0;
  const rts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    if (resp?.chosenIndex === t.correctIndex) { hits++; rts.push(resp.reactionTimeMs); }
    else errors++;
  }
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { hits, errors, meanRt };
}
