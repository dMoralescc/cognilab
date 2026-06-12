import { useState, useEffect } from 'react';
import { attentionSpan } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'expose' | 'recall' | 'done';

export function AttentionSpanPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => attentionSpan.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('expose');
  const [selected, setSelected] = useState<number[]>([]);

  const total = stimuli.gridSize * stimuli.gridSize;

  // Exposure phase: show targets then switch to recall
  useEffect(() => {
    if (phase !== 'expose') return;
    const timer = setTimeout(() => setPhase('recall'), stimuli.exposureTimeMs);
    return () => clearTimeout(timer);
  }, [phase, stimuli.exposureTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = attentionSpan.summarize(stimuli, selected);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (idx: number) => {
    if (phase !== 'recall') return;
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const confirm = () => setPhase('done');

  const cols = stimuli.gridSize;
  const targetSet = new Set(stimuli.targetPositions);

  return (
    <div className="select-none">
      <p className="mb-3 text-center text-sm text-gray-600">
        {phase === 'expose'
          ? 'Memoriza las casillas iluminadas'
          : 'Selecciona las casillas que se iluminaron'}
      </p>

      <div
        className="mx-auto grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 56}px` }}
      >
        {Array.from({ length: total }, (_, idx) => {
          const isTarget = targetSet.has(idx);
          const isSelected = selected.includes(idx);
          let bg = 'bg-gray-100 hover:bg-gray-200';
          if (phase === 'expose') {
            bg = isTarget ? 'bg-indigo-500' : 'bg-gray-100';
          } else {
            bg = isSelected ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gray-100 hover:bg-gray-200';
          }
          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              className={`h-12 w-full rounded-lg border-2 border-gray-200 transition-colors ${bg}`}
            />
          );
        })}
      </div>

      {phase === 'recall' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={confirm}
            disabled={selected.length === 0}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Confirmar selección
          </button>
        </div>
      )}
    </div>
  );
}
