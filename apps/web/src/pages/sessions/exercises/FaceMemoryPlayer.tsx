import { useState, useEffect } from 'react';
import { faceMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'study' | 'delay' | 'test' | 'done';

export function FaceMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => faceMemory.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('study');
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'study') {
      const t = setTimeout(() => setPhase('delay'), stimuli.studyTimeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'delay') {
      const t = setTimeout(() => setPhase('test'), stimuli.delayTimeMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.studyTimeMs, stimuli.delayTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = faceMemory.summarize(stimuli, selected);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: number) => {
    if (phase !== 'test') return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="select-none text-center">
      {phase === 'study' && (
        <>
          <p className="mb-4 text-sm text-gray-600">Memoriza estas caras</p>
          <div className="flex flex-wrap justify-center gap-4">
            {stimuli.studyFaces.map((f) => (
              <div key={f.id} className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-indigo-200 bg-indigo-50 text-4xl">
                {f.avatar}
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'delay' && (
        <div className="flex h-48 items-center justify-center">
          <p className="text-xl text-gray-400">Preparando test...</p>
        </div>
      )}

      {phase === 'test' && (
        <>
          <p className="mb-4 text-sm text-gray-600">Selecciona las caras que ya has visto</p>
          <div className="flex flex-wrap justify-center gap-3">
            {stimuli.testFaces.map((f) => {
              const isSel = selected.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`h-16 w-16 rounded-2xl border-2 text-4xl transition-colors ${isSel ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                >
                  {f.avatar}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPhase('done')}
            disabled={selected.length === 0}
            className="mt-5 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Confirmar ({selected.length} seleccionadas)
          </button>
        </>
      )}
    </div>
  );
}
