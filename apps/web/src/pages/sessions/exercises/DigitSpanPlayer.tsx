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
  const [response, setResponse] = useState<number[]>([]);

  // Show digits one by one
  useEffect(() => {
    if (phase !== 'show') return;
    if (showIdx >= stimuli.sequence.length) { setPhase('recall'); return; }
    const t = setTimeout(() => setShowIdx((i) => i + 1), 1000);
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

  const currentDigit = stimuli.sequence[showIdx - 1];
  const label = stimuli.direction === 'backward' ? 'al revés' : 'en orden';

  return (
    <div className="select-none text-center">
      <p className="mb-4 text-sm text-gray-600">
        {phase === 'show' ? 'Memoriza los dígitos' : `Introduce los dígitos ${label}`}
      </p>

      {/* Digit display */}
      <div className="mb-6 flex h-28 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50">
        {phase === 'show' && showIdx > 0 && currentDigit !== undefined ? (
          <span className="text-7xl font-bold text-indigo-600">{currentDigit}</span>
        ) : phase === 'show' ? (
          <span className="text-xl text-gray-400">Preparado...</span>
        ) : (
          <div className="flex gap-2">
            {Array.from({ length: stimuli.sequence.length }, (_, i) => (
              <div key={i} className={`h-10 w-10 rounded-lg border-2 ${i < response.length ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'} flex items-center justify-center text-xl font-bold text-indigo-700`}>
                {response[i] ?? ''}
              </div>
            ))}
          </div>
        )}
      </div>

      {phase === 'recall' && (
        <div className="grid grid-cols-5 gap-2">
          {[1,2,3,4,5,6,7,8,9,0].map((d) => (
            <button
              key={d}
              onClick={() => press(d)}
              className="h-14 rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200"
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
