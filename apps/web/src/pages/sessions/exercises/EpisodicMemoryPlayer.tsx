import { useState, useEffect } from 'react';
import { episodicMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'study' | 'recall' | 'done';

export function EpisodicMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => episodicMemory.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('study');
  const [eventIdx, setEventIdx] = useState(0);
  const [response, setResponse] = useState<episodicMemory.EpisodicMemoryResponse>([]);

  // Unique locations and times from generated events
  const locations = [...new Set(stimuli.events.map((e) => e.location))];
  const times = [...new Set(stimuli.events.map((e) => e.time))];

  const [chosenLoc, setChosenLoc] = useState<string | null>(null);
  const [chosenTime, setChosenTime] = useState<string | null>(null);

  useEffect(() => {
    if (phase === 'study') {
      const t = setTimeout(() => setPhase('recall'), stimuli.studyTimeMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.studyTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = episodicMemory.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setChosenLoc(null); setChosenTime(null); }, [eventIdx]);

  const confirmEvent = () => {
    const ev = stimuli.events[eventIdx];
    if (!ev || !chosenLoc || !chosenTime) return;
    const next = [...response, { eventId: ev.id, object: ev.object, location: chosenLoc, time: chosenTime }];
    setResponse(next);
    if (eventIdx + 1 >= stimuli.events.length) setPhase('done');
    else setEventIdx((i) => i + 1);
  };

  const currentEvent = stimuli.events[eventIdx];

  return (
    <div className="select-none">
      {phase === 'study' && (
        <>
          <p className="mb-3 text-center text-sm text-gray-600">Memoriza dónde y cuándo estaba cada objeto</p>
          <div className="space-y-2">
            {stimuli.events.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="text-3xl">{ev.object}</span>
                <span className="text-gray-400">→</span>
                <span className="flex-1 text-sm font-medium text-gray-700">{ev.location}</span>
                <span className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{ev.time}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'recall' && currentEvent && (
        <>
          <p className="mb-2 text-center text-xs text-gray-400">
            Evento {eventIdx + 1} de {stimuli.events.length}
          </p>
          <div className="mb-5 flex h-20 items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50">
            <span className="text-4xl">{currentEvent.object}</span>
            <span className="text-gray-400 text-sm">¿Dónde y cuándo?</span>
          </div>

          <div className="mb-3">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Lugar</p>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setChosenLoc(loc)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${chosenLoc === loc ? 'border-indigo-500 bg-indigo-100 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Momento</p>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => setChosenTime(t)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-colors ${chosenTime === t ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={confirmEvent}
            disabled={!chosenLoc || !chosenTime}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Confirmar
          </button>
        </>
      )}
    </div>
  );
}
