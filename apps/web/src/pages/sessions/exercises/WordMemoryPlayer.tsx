import { useState, useEffect } from 'react';
import { wordMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'study' | 'delay' | 'test' | 'done';

export function WordMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => wordMemory.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('study');
  const [selected, setSelected] = useState<string[]>([]);

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
    const summary = wordMemory.summarize(stimuli, selected);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (word: string) => {
    if (phase !== 'test') return;
    setSelected((prev) => prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]);
  };

  return (
    <div className="select-none">
      {phase === 'study' && (
        <>
          <p className="mb-4 text-center text-sm text-gray-600">Memoriza estas palabras</p>
          <div className="flex flex-wrap justify-center gap-2">
            {stimuli.studyWords.map((w) => (
              <span key={w} className="rounded-lg bg-indigo-50 px-4 py-2 text-lg font-semibold text-indigo-700">{w}</span>
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
          <p className="mb-4 text-center text-sm text-gray-600">Selecciona las palabras que ya has visto</p>
          <div className="flex flex-wrap justify-center gap-2">
            {stimuli.testWords.map((w) => {
              const isSel = selected.includes(w);
              return (
                <button
                  key={w}
                  onClick={() => toggle(w)}
                  className={`rounded-lg border-2 px-4 py-2 text-base font-semibold transition-colors ${isSel ? 'border-indigo-500 bg-indigo-100 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {w}
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
