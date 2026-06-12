import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Stop-signal task: respond to go stimulus, but inhibit if stop signal appears
export interface InhibitionTrial {
  id: number;
  stimulus: string;
  hasStopSignal: boolean;
  stopSignalDelayMs: number;  // ms after stimulus onset before stop signal
  goDelayMs: number;           // ISI before stimulus
}

export interface InhibitionStimuli {
  trials: InhibitionTrial[];
  goDurationMs: number;
  stimulusDurationMs: number;
  timeLimit: number;
}

export interface InhibitionTrialResponse {
  trialId: number;
  responded: boolean;
  reactionTimeMs: number;
}

export type InhibitionResponse = InhibitionTrialResponse[];

interface LevelParams { trials: number; stopRate: number; stopDelay: number; goDuration: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 20, stopRate: 0.30, stopDelay: 250, goDuration: 1500, timeLimit: 90 },
  2: { trials: 25, stopRate: 0.30, stopDelay: 200, goDuration: 1200, timeLimit: 90 },
  3: { trials: 30, stopRate: 0.25, stopDelay: 250, goDuration: 1000, timeLimit: 90 },
  4: { trials: 35, stopRate: 0.25, stopDelay: 300, goDuration: 900,  timeLimit: 100 },
  5: { trials: 40, stopRate: 0.20, stopDelay: 350, goDuration: 800,  timeLimit: 110 },
};

const GO_STIMULUS = '◯';
const STOP_STIMULUS = '✕';

export function generate(level: number, seed: number): ExerciseContent<InhibitionStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const stopCount = Math.round(p.trials * p.stopRate);
  const hasStop = [...Array(stopCount).fill(true), ...Array(p.trials - stopCount).fill(false)] as boolean[];
  for (let i = hasStop.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = hasStop[i] as boolean; hasStop[i] = hasStop[j] as boolean; hasStop[j] = tmp;
  }
  const trials: InhibitionTrial[] = hasStop.map((hasStopSignal, id) => ({
    id,
    stimulus: GO_STIMULUS,
    hasStopSignal,
    stopSignalDelayMs: hasStopSignal ? p.stopDelay + Math.floor(rng() * 100 - 50) : 0,
    goDelayMs: 800 + Math.floor(rng() * 400),
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, goDurationMs: p.goDuration, stimulusDurationMs: p.goDuration, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: InhibitionStimuli, r: InhibitionResponse): TrialResult<InhibitionStimuli, InhibitionResponse> {
  const { goHits, stopErrors, meanRt } = computeMetrics(s, r);
  void goHits;
  return { isCorrect: stopErrors === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: InhibitionStimuli, r: InhibitionResponse): ExerciseSummary {
  const { goHits, goOmissions, stopErrors, stopSuccesses, meanRt } = computeMetrics(s, r);
  return { hits: goHits + stopSuccesses, errors: goOmissions + stopErrors, reactionTimeMs: meanRt,
    rawData: { goHits, goOmissions, stopErrors, stopSuccesses } };
}

function computeMetrics(s: InhibitionStimuli, r: InhibitionResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let goHits = 0, goOmissions = 0, stopErrors = 0, stopSuccesses = 0;
  const rts: number[] = [];
  for (const t of s.trials) {
    const resp = map.get(t.id);
    const responded = resp?.responded ?? false;
    if (!t.hasStopSignal) {
      if (responded) { goHits++; rts.push(resp!.reactionTimeMs); }
      else goOmissions++;
    } else {
      if (responded) stopErrors++;
      else stopSuccesses++;
    }
  }
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  return { goHits, goOmissions, stopErrors, stopSuccesses, meanRt };
}

export { GO_STIMULUS, STOP_STIMULUS };
