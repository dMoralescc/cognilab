import { useState, useEffect, useRef } from 'react';
import { cancellation } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (result: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const SYMBOL_COLOR: Record<string, string> = {
  '★': 'text-indigo-600',
  '✦': 'text-violet-500',
  '♦': 'text-slate-500',
  '△': 'text-slate-400',
  '□': 'text-gray-400',
  '○': 'text-gray-300',
};

export function CancellationPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [content] = useState(() => cancellation.generate(level, seed));
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const tapTimesRef = useRef<Map<number, number>>(new Map());

  const { stimuli } = content;
  const cellSize = stimuli.gridSize <= 7 ? 54 : stimuli.gridSize <= 9 ? 44 : 36;

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
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          Pulsa todos los <span className="text-xl font-bold text-indigo-600">★</span> que veas
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            {tapped.size} seleccionados
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex justify-center overflow-x-auto py-1">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${stimuli.gridSize}, ${cellSize}px)` }}
        >
          {stimuli.symbols.map((sym, idx) => {
            const isTapped = tapped.has(idx);
            const isTarget = sym === '★';
            return (
              <button
                key={idx}
                onClick={() => tap(idx)}
                className={`flex items-center justify-center rounded-lg border-2 text-lg font-bold transition-all select-none active:scale-90 ${
                  isTapped
                    ? isTarget
                      ? 'border-indigo-500 bg-indigo-100 shadow-sm shadow-indigo-200 scale-105'
                      : 'border-red-400 bg-red-50 scale-105'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                } ${SYMBOL_COLOR[sym] ?? 'text-gray-600'}`}
                style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.45 }}
              >
                {sym}
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
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
        >
          Finalizar ↵
        </button>
      </div>
    </div>
  );
}
