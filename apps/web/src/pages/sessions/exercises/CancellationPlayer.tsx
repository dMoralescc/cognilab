import { useState, useEffect, useRef } from 'react';
import { cancellation } from '@cognilab/shared';
import { ShapeIcon } from './ShapeIcon';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (result: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function CancellationPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [content] = useState(() => cancellation.generate(level, seed));
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const tapTimesRef = useRef<Map<number, number>>(new Map());

  const { stimuli } = content;
  const cellSize = stimuli.gridSize <= 7 ? 56 : stimuli.gridSize <= 9 ? 46 : 38;
  const iconSize = Math.round(cellSize * 0.55);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Enter') handleSubmit(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  const tap = (idx: number) => {
    setTapped((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        tapTimesRef.current.delete(idx);
      } else {
        next.add(idx);
        tapTimesRef.current.set(idx, elapsedMs);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const response: cancellation.CancellationResponse = [...tapped].map((position) => ({
      position,
      reactionTimeMs: tapTimesRef.current.get(position) ?? elapsedMs,
    }));
    const summary = cancellation.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          Pulsa todas las
          <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <ShapeIcon shape={stimuli.targetSymbol} size={22} color="#374151" strokeWidth={2.5} />
          </span>
          que veas
        </p>
        <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
          {tapped.size} marcadas
        </span>
      </div>

      {/* Grid */}
      <div className="flex justify-center overflow-x-auto py-1">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${stimuli.gridSize}, ${cellSize}px)` }}
        >
          {stimuli.symbols.map((sym, idx) => {
            const isTapped = tapped.has(idx);
            const isTarget = sym === stimuli.targetSymbol;
            return (
              <button
                key={idx}
                onClick={() => tap(idx)}
                className={`flex items-center justify-center rounded-xl border-2 transition-all select-none active:scale-90 ${
                  isTapped
                    ? isTarget
                      ? 'border-emerald-400 bg-emerald-100 shadow-md scale-110'
                      : 'border-red-400 bg-red-100 scale-110'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:scale-105'
                }`}
                style={{ width: cellSize, height: cellSize }}
              >
                <ShapeIcon
                  shape={sym}
                  size={iconSize}
                  color={isTapped ? (isTarget ? '#059669' : '#dc2626') : '#374151'}
                  strokeWidth={2.5}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Pulsa Enter o el botón para finalizar</p>
        <button
          onClick={handleSubmit}
          className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          Finalizar ↵
        </button>
      </div>
    </div>
  );
}
