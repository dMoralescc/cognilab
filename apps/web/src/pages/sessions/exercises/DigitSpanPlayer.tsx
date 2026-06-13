import { useState, useEffect } from 'react';
import { digitSpan } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'show' | 'recall' | 'done';

export function DigitSpanPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => digitSpan.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('show');
  const [showIdx, setShowIdx] = useState(0);
  const [digitKey, setDigitKey] = useState(0);
  const [response, setResponse] = useState<number[]>([]);

  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= stimuli.sequence.length) {
      setPhase('recall');
      return;
    }
    setDigitKey((k) => k + 1);
    const t = setTimeout(() => setShowIdx((i) => i + 1), 950);
    return () => clearTimeout(t);
  }, [phase, showIdx, stimuli.sequence.length]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = digitSpan.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (d: number) => {
    if (phase !== 'recall') return;
    const next = [...response, d];
    setResponse(next);
    if (next.length >= stimuli.sequence.length) setPhase('done');
  };

  const del = () => {
    if (phase !== 'recall' || response.length === 0) return;
    setResponse((r) => r.slice(0, -1));
  };

  const currentDigit = stimuli.sequence[showIdx - 1];
  const label = stimuli.direction === 'backward' ? 'al revés (último → primero)' : 'en el mismo orden';

  return (
    <div className="select-none space-y-4 text-center">
      {/* Phase label */}
      <p className="text-sm font-medium text-gray-700">
        {phase === 'show' ? 'Memoriza los dígitos' : `Introduce los dígitos ${label}`}
      </p>

      {/* Sequence position dots */}
      <div className="flex justify-center gap-1.5">
        {stimuli.sequence.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-full transition-all ${
              phase === 'show'
                ? i < showIdx ? 'bg-indigo-500' : i === showIdx ? 'bg-indigo-300 animate-pulse' : 'bg-gray-200'
                : i < response.length ? 'bg-green-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Main display */}
      <div className="flex h-36 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50">
        {phase === 'show' ? (
          showIdx === 0 ? (
            <span className="text-lg text-gray-400">Preparado…</span>
          ) : currentDigit !== undefined ? (
            <span key={digitKey} className="animate-pop-in text-8xl font-extrabold text-indigo-600">
              {currentDigit}
            </span>
          ) : null
        ) : (
          <div className="flex gap-2 px-4">
            {Array.from({ length: stimuli.sequence.length }, (_, i) => (
              <div
                key={i}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-all ${
                  i < response.length
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                    : i === response.length
                    ? 'border-indigo-300 bg-white text-transparent animate-pulse'
                    : 'border-gray-200 bg-white text-transparent'
                }`}
              >
                {response[i] ?? ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Numpad */}
      {phase === 'recall' && (
        <div className="grid grid-cols-3 gap-2.5 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 active:scale-95 active:bg-indigo-200"
            >
              {d}
            </button>
          ))}
          <button
            onClick={del}
            className="h-14 rounded-xl bg-gray-100 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:bg-gray-200 active:scale-95"
          >
            ⌫
          </button>
          <button
            onClick={() => press(0)}
            className="h-14 rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-100 active:scale-95 active:bg-indigo-200"
          >
            0
          </button>
          <div className="h-14" />
        </div>
      )}
    </div>
  );
}
