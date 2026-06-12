import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

// Prospective memory: user does a main color-matching task and must remember to press
// a special button when a specific cue word appears.
export interface ProspectiveTrial {
  id: number;
  mainColor: string;        // the color to identify (main task)
  cueWord: string | null;   // non-null only on cue trials
  isProspectiveCue: boolean;
}

export interface ProspectiveMemoryStimuli {
  trials: ProspectiveTrial[];
  intentions: string[];   // cue words to watch for
  timeLimit: number;
}

export interface ProspectiveTrialResponse {
  trialId: number;
  mainResponse: string;         // color chosen
  prospectiveResponse: boolean; // did user press the special button
  reactionTimeMs: number;
}

export type ProspectiveMemoryResponse = ProspectiveTrialResponse[];

const COLORS = ['rojo', 'azul', 'verde', 'amarillo', 'naranja'];
const CUE_WORDS = ['barco', 'luna', 'árbol', 'piedra', 'viento', 'nube', 'rio', 'campo'];

interface LevelParams { trials: number; intentions: number; signalRate: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { trials: 15, intentions: 1, signalRate: 0.20, timeLimit: 90 },
  2: { trials: 20, intentions: 1, signalRate: 0.15, timeLimit: 90 },
  3: { trials: 25, intentions: 2, signalRate: 0.12, timeLimit: 100 },
  4: { trials: 30, intentions: 2, signalRate: 0.10, timeLimit: 110 },
  5: { trials: 35, intentions: 2, signalRate: 0.08, timeLimit: 120 },
};

export function generate(level: number, seed: number): ExerciseContent<ProspectiveMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const intentions = CUE_WORDS.slice(0, p.intentions);
  const cueCount = Math.max(1, Math.round(p.trials * p.signalRate));
  const isCue = [...Array(cueCount).fill(true), ...Array(p.trials - cueCount).fill(false)] as boolean[];
  for (let i = isCue.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = isCue[i] as boolean; isCue[i] = isCue[j] as boolean; isCue[j] = tmp;
  }
  const trials: ProspectiveTrial[] = isCue.map((isProspectiveCue, id) => ({
    id,
    mainColor: COLORS[Math.floor(rng() * COLORS.length)] as string,
    cueWord: isProspectiveCue ? intentions[Math.floor(rng() * intentions.length)] ?? null : null,
    isProspectiveCue,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: { trials, intentions, timeLimit: p.timeLimit } };
}

export function evaluate(s: ProspectiveMemoryStimuli, r: ProspectiveMemoryResponse): TrialResult<ProspectiveMemoryStimuli, ProspectiveMemoryResponse> {
  const { prospectiveHits, prospectiveErrors } = computeMetrics(s, r);
  void prospectiveHits;
  return { isCorrect: prospectiveErrors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: ProspectiveMemoryStimuli, r: ProspectiveMemoryResponse): ExerciseSummary {
  const { mainHits, mainErrors, prospectiveHits, prospectiveErrors } = computeMetrics(s, r);
  const cueCount = s.trials.filter((t) => t.isProspectiveCue).length;
  return { hits: prospectiveHits + mainHits, errors: prospectiveErrors + mainErrors, reactionTimeMs: null,
    rawData: { prospectiveHits, prospectiveErrors, mainHits, mainErrors, cueCount } };
}

function computeMetrics(s: ProspectiveMemoryStimuli, r: ProspectiveMemoryResponse) {
  const map = new Map(r.map((x) => [x.trialId, x]));
  let mainHits = 0, mainErrors = 0, prospectiveHits = 0, prospectiveErrors = 0;
  for (const trial of s.trials) {
    const resp = map.get(trial.id);
    if (resp?.mainResponse === trial.mainColor) mainHits++;
    else mainErrors++;
    if (trial.isProspectiveCue) {
      if (resp?.prospectiveResponse) prospectiveHits++;
      else prospectiveErrors++;
    }
  }
  return { mainHits, mainErrors, prospectiveHits, prospectiveErrors };
}
