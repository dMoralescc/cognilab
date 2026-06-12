import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Auditory attention: user sees a word displayed on screen and must tap only when it matches the target.
// (The "auditory" nature is simulated visually since browsers don't provide TTS easily;
// in a future native version this can be replaced with speech synthesis.)
export interface AuditoryTrial {
  id: number;
  word: string;
  isTarget: boolean;
  displayDurationMs: number;
}

export interface AuditoryAttentionStimuli {
  trials: AuditoryTrial[];
  targetWord: string;
  rate: number; // ms between trials (isi)
  timeLimit: number;
}

export interface AuditoryTrialResponse {
  trialId: number;
  responded: boolean;
  reactionTimeMs: number;
}

export type AuditoryAttentionResponse = AuditoryTrialResponse[];

interface LevelParams { trials: number; targetRate: number; displayMs: number; isiMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 20, targetRate: 0.30, displayMs: 1500, isiMs: 1000, timeLimit: 90 },
  2: { trials: 25, targetRate: 0.25, displayMs: 1200, isiMs: 800,  timeLimit: 90 },
  3: { trials: 30, targetRate: 0.20, displayMs: 1000, isiMs: 700,  timeLimit: 90 },
  4: { trials: 35, targetRate: 0.20, displayMs: 800,  isiMs: 600,  timeLimit: 90 },
  5: { trials: 40, targetRate: 0.15, displayMs: 600,  isiMs: 500,  timeLimit: 90 },
};

// Phonetically similar words at higher levels
const WORD_BANKS: Record<number, { target: string; words: string[] }> = {
  1: { target: 'GATO',  words: ['GATO','PATO','LORO','PATO','RANA','TORO','OSO','VACA','GATO','RANA','PERRO','GATO'] },
  2: { target: 'CASA',  words: ['CASA','MASA','PASA','TASA','BASA','CASA','GASA','RASA','CASA','MESA','LASA','CASA'] },
  3: { target: 'LUNA',  words: ['LUNA','DUNA','TUNA','PUNA','LUNA','MUNA','SUNA','RUNA','LUNA','BUNA','LUNA','CUNA'] },
  4: { target: 'BARRO', words: ['BARRO','PARRO','MARRO','TARRO','CARRO','BARRO','DARRO','FARRO','BARRO','GARRO','LARRO','BARRO'] },
  5: { target: 'BRISA', words: ['BRISA','FRISA','GRISA','PRISA','TRISA','CRISA','DRISA','BRISA','MRISA','ARISA','BRISA','LRISA'] },
};

export function generate(level: number, seed: number): ExerciseContent<AuditoryAttentionStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const bank = WORD_BANKS[level] ?? WORD_BANKS[1]!;
  const rng = seededRandom(seed);

  const targetCount = Math.round(p.trials * p.targetRate);
  const isTargetArr = [...Array(targetCount).fill(true), ...Array(p.trials - targetCount).fill(false)] as boolean[];
  for (let i = isTargetArr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = isTargetArr[i] as boolean; isTargetArr[i] = isTargetArr[j] as boolean; isTargetArr[j] = tmp;
  }

  const distractors = bank.words.filter((w) => w !== bank.target);
  const trials: AuditoryTrial[] = isTargetArr.map((isTarget, id) => ({
    id,
    word: isTarget ? bank.target : distractors[Math.floor(rng() * distractors.length)] ?? distractors[0]!,
    isTarget,
    displayDurationMs: p.displayMs,
  }));

  return { level, seed, timeLimit: p.timeLimit, stimuli: {
    trials, targetWord: bank.target, rate: p.isiMs, timeLimit: p.timeLimit,
  }};
}

export function evaluate(s: AuditoryAttentionStimuli, r: AuditoryAttentionResponse): TrialResult<AuditoryAttentionStimuli, AuditoryAttentionResponse> {
  const { hits, omissions, commissions } = computeMetrics(s, r);
  const rts = r.filter((x) => x.responded).map((x) => x.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
  void hits;
  return { isCorrect: omissions === 0 && commissions === 0, reactionTimeMs: meanRt, stimulus: s, response: r };
}

export function summarize(s: AuditoryAttentionStimuli, r: AuditoryAttentionResponse): ExerciseSummary {
  const { hits, omissions, commissions } = computeMetrics(s, r);
  const rts = r.filter((x) => x.responded).map((x) => x.reactionTimeMs);
  const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  return { hits, errors: omissions + commissions, reactionTimeMs: meanRt,
    rawData: { omissions, commissions, targetCount: s.trials.filter((t) => t.isTarget).length } };
}

function computeMetrics(s: AuditoryAttentionStimuli, r: AuditoryAttentionResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let hits = 0, omissions = 0, commissions = 0;
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    const responded = resp?.responded ?? false;
    if (trial.isTarget) { if (responded) hits++; else omissions++; }
    else { if (responded) commissions++; }
  }
  return { hits, omissions, commissions };
}
