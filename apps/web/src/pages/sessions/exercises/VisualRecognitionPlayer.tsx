import { useState, useEffect } from 'react';
import { visualRecognition } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'study' | 'test' | 'done';

export function VisualRecognitionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => visualRecognition.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('study');
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'study') {
      const t = setTimeout(() => setPhase('test'), stimuli.studyTimeMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.studyTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = visualRecognition.summarize(stimuli, selected);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => {
    if (phase !== 'test') return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="select-none">
      {phase === 'study' && (
        <>
          <p className="mb-4 text-center text-sm text-gray-600">Memoriza estos objetos</p>
          <div className="flex flex-wrap justify-center gap-3">
            {stimuli.studyItems.map((it) => (
              <div key={it.id} className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-3xl">{it.emoji}</div>
            ))}
          </div>
        </>
      )}

      {phase === 'test' && (
        <>
          <p className="mb-4 text-center text-sm text-gray-600">Selecciona los objetos que ya has visto</p>
          <div className="flex flex-wrap justify-center gap-2">
            {stimuli.testItems.map((it) => {
              const isSel = selected.includes(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => toggle(it.id)}
                  className={`h-14 w-14 rounded-xl border-2 text-3xl transition-colors ${isSel ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                >
                  {it.emoji}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setPhase('done')}
              disabled={selected.length === 0}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              Confirmar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
