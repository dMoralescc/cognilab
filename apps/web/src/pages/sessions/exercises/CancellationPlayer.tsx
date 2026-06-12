import { useState, useEffect, useRef } from 'react';
import { cancellation } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (result: {
    hits: number;
    errors: number;
    reactionTimeMs: number | null;
    rawData: Record<string, unknown>;
  }) => void;
}

const SYMBOL_FONT: Record<string, string> = {
  '★': 'text-indigo-700',
  '✦': 'text-indigo-400',
  '♦': 'text-gray-600',
  '△': 'text-gray-500',
  '□': 'text-gray-400',
  '○': 'text-gray-300',
};

export function CancellationPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [content] = useState(() => cancellation.generate(level, seed));
  const [tapped, setTapped] = useState<Set<number>>(new Set());
  const tapTimesRef = useRef<Map<number, number>>(new Map());

  const { stimuli } = content;
  const cellSize = stimuli.gridSize <= 7 ? 56 : stimuli.gridSize <= 9 ? 46 : 38;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    };
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
    onComplete({
      hits: summary.hits,
      errors: summary.errors,
      reactionTimeMs: summary.reactionTimeMs,
      rawData: summary.rawData,
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Pulsa todos los <span className="font-bold text-indigo-700">★</span> que veas.
        </p>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600">
          {tapped.size} seleccionados
        </span>
      </div>

      <div
        className="mx-auto grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${stimuli.gridSize}, ${cellSize}px)`,
          width: `${stimuli.gridSize * (cellSize + 4)}px`,
        }}
      >
        {stimuli.symbols.map((sym, idx) => {
          const isTapped = tapped.has(idx);
          return (
            <button
              key={idx}
              onClick={() => tap(idx)}
              className={`flex items-center justify-center rounded-md border-2 text-xl font-bold transition-colors select-none
                ${isTapped
                  ? 'border-indigo-600 bg-indigo-100'
                  : 'border-gray-200 bg-white hover:border-gray-400'}
                ${SYMBOL_FONT[sym] ?? 'text-gray-700'}
              `}
              style={{ width: cellSize, height: cellSize }}
            >
              {sym}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Finalizar (Enter)
        </button>
      </div>
    </div>
  );
}
