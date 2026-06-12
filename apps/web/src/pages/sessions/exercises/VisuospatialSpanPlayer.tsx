import { useState, useEffect, useRef } from 'react';
import { visuospatialSpan } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'show' | 'recall' | 'done';

export function VisuospatialSpanPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => visuospatialSpan.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('show');
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [response, setResponse] = useState<number[]>([]);
  const stepRef = useRef(0);

  useEffect(() => {
    if (phase !== 'show') return;
    if (stepRef.current >= stimuli.sequence.length) {
      const t = setTimeout(() => setPhase('recall'), 600);
      return () => clearTimeout(t);
    }
    const blockId = stimuli.sequence[stepRef.current];
    const t1 = setTimeout(() => setHighlightId(blockId ?? null), 200);
    const t2 = setTimeout(() => { setHighlightId(null); stepRef.current++; }, 200 + stimuli.speedMs * 0.7);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, highlightId, stimuli]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = visuospatialSpan.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (id: number) => {
    if (phase !== 'recall') return;
    const next = [...response, id];
    setResponse(next);
    if (next.length >= stimuli.sequence.length) setPhase('done');
  };

  return (
    <div className="select-none">
      <p className="mb-4 text-center text-sm text-gray-600">
        {phase === 'show' ? 'Memoriza el orden de los bloques' : `Toca los bloques en el mismo orden (${response.length}/${stimuli.sequence.length})`}
      </p>
      <div className="relative mx-auto h-64 w-full rounded-xl border border-gray-200 bg-gray-50">
        {stimuli.blocks.map((b) => {
          const isHighlighted = highlightId === b.id;
          const tapCount = response.filter((id) => id === b.id).length;
          return (
            <button
              key={b.id}
              onClick={() => tap(b.id)}
              className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 transition-all ${
                isHighlighted ? 'scale-110 border-indigo-500 bg-indigo-500' :
                tapCount > 0 ? 'border-green-400 bg-green-100' :
                'border-gray-300 bg-white hover:bg-gray-100'
              }`}
              style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
            >
              {phase === 'recall' && tapCount > 0 && (
                <span className="text-xs font-bold text-green-700">{tapCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
