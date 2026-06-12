import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface EpisodicEvent {
  id: number;
  object: string;
  location: string;
  time: string;
}

export interface EpisodicMemoryStimuli {
  events: EpisodicEvent[];
  studyTimeMs: number;
  timeLimit: number;
}

// For each event id, user answers what object was where and when
export type EpisodicMemoryResponse = Array<{ eventId: number; object: string; location: string; time: string }>;

const OBJECTS   = ['🔑','📚','🎸','⚽','🎨','🔭','🎯','🎲','🏆','🎀'];
const LOCATIONS = ['cocina','dormitorio','salón','jardín'];
const TIMES     = ['mañana','tarde'];

interface LevelParams { objectCount: number; locationCount: number; timeContexts: number; studyMs: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { objectCount: 4,  locationCount: 2, timeContexts: 1, studyMs: 8000,  timeLimit: 70 },
  2: { objectCount: 6,  locationCount: 2, timeContexts: 1, studyMs: 7000,  timeLimit: 90 },
  3: { objectCount: 6,  locationCount: 3, timeContexts: 2, studyMs: 6000,  timeLimit: 100 },
  4: { objectCount: 8,  locationCount: 3, timeContexts: 2, studyMs: 5000,  timeLimit: 110 },
  5: { objectCount: 10, locationCount: 4, timeContexts: 2, studyMs: 4000,  timeLimit: 130 },
};

export function generate(level: number, seed: number): ExerciseContent<EpisodicMemoryStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const rng = seededRandom(seed);
  const locs = LOCATIONS.slice(0, p.locationCount);
  const times = TIMES.slice(0, p.timeContexts);
  const objs = [...OBJECTS];
  for (let i = objs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = objs[i] as string; objs[i] = objs[j] as string; objs[j] = tmp;
  }
  const events: EpisodicEvent[] = objs.slice(0, p.objectCount).map((object, id) => ({
    id,
    object,
    location: locs[Math.floor(rng() * locs.length)] as string,
    time: times[Math.floor(rng() * times.length)] as string,
  }));
  return { level, seed, timeLimit: p.timeLimit, stimuli: { events, studyTimeMs: p.studyMs, timeLimit: p.timeLimit } };
}

export function evaluate(s: EpisodicMemoryStimuli, r: EpisodicMemoryResponse): TrialResult<EpisodicMemoryStimuli, EpisodicMemoryResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: EpisodicMemoryStimuli, r: EpisodicMemoryResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { eventCount: s.events.length } };
}

function computeMetrics(s: EpisodicMemoryStimuli, r: EpisodicMemoryResponse) {
  const map = new Map(r.map((x) => [x.eventId, x]));
  let hits = 0, errors = 0;
  for (const ev of s.events) {
    const resp = map.get(ev.id);
    if (resp?.object === ev.object && resp?.location === ev.location && resp?.time === ev.time) hits++;
    else errors++;
  }
  return { hits, errors };
}
