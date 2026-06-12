import { useState, useEffect, useRef } from 'react';
import { positionSequences } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'show' | 'recall' | 'done';

export function PositionSequencesPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => positionSequences.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('show');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [response, setResponse] = useState<number[]>([]);
  const seqRef = useRef(0);

  // Animate sequence
  useEffect(() => {
    if (phase !== 'show') return;
    if (seqRef.current >= stimuli.sequence.length) {
      const t = setTimeout(() => setPhase('recall'), 500);
      return () => clearTimeout(t);
    }
    const pos = stimuli.sequence[seqRef.current];
    const t1 = setTimeout(() => setHighlightIdx(pos ?? -1), 200);
    const t2 = setTimeout(() => { setHighlightIdx(-1); seqRef.current++; }, 200 + stimuli.speedMs * 0.7);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase, highlightIdx, stimuli]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = positionSequences.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (idx: number) => {
    if (phase !== 'recall') return;
    const next = [...response, idx];
    setResponse(next);
    if (next.length >= stimuli.sequence.length) setPhase('done');
  };

  const cols = stimuli.gridSize;
  const total = cols * cols;

  return (
    <div className="select-none">
      <p className="mb-4 text-center text-sm text-gray-600">
        {phase === 'show' ? 'Memoriza la secuencia de casillas' : `Repite la secuencia (${response.length}/${stimuli.sequence.length})`}
      </p>
      <div
        className="mx-auto grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 64}px` }}
      >
        {Array.from({ length: total }, (_, idx) => {
          const isHighlighted = highlightIdx === idx;
          const tapIdx = phase === 'recall' ? response.lastIndexOf(idx) : -1;
          const showTap = tapIdx !== -1;
          return (
            <button
              key={idx}
              onClick={() => tap(idx)}
              className={`h-14 w-full rounded-xl border-2 transition-colors ${
                isHighlighted ? 'border-indigo-500 bg-indigo-400 scale-105' :
                showTap ? 'border-green-400 bg-green-100' :
                'border-gray-200 bg-gray-100 hover:bg-gray-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
