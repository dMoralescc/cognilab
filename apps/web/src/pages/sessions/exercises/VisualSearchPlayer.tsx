import { useState } from 'react';
import { visualSearch } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const SYMBOL_SIZE = 36;

export function VisualSearchPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [{ stimuli }] = useState(() => visualSearch.generate(level, seed));
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = (id: number) => {
    if (confirmed) return;
    setSelected(id);
  };

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    const response: visualSearch.VisualSearchResponse = {
      selectedId: selected,
      reactionTimeMs: elapsedMs,
    };
    const summary = visualSearch.summarize(stimuli, response);
    onComplete({
      hits: summary.hits,
      errors: summary.errors,
      reactionTimeMs: summary.reactionTimeMs,
      rawData: summary.rawData,
    });
  };

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        Encuentra y pulsa el símbolo{' '}
        <span className="mx-1 text-xl font-bold text-indigo-700">{stimuli.target}</span>
        entre todos los demás.
      </p>

      {/* Canvas */}
      <div
        className="relative mx-auto overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50"
        style={{ width: '100%', paddingBottom: '60%' }}
      >
        {stimuli.items.map((item) => {
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              disabled={confirmed}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: SYMBOL_SIZE,
                height: SYMBOL_SIZE,
                transform: 'translate(-50%,-50%)',
              }}
              className={`flex items-center justify-center rounded-lg text-xl font-bold transition-all select-none
                ${isSelected
                  ? 'border-2 border-indigo-600 bg-indigo-100 text-indigo-700 scale-125'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-indigo-400 hover:scale-110'}
              `}
            >
              {item.symbol}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleConfirm}
          disabled={selected === null || confirmed}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Confirmar selección
        </button>
      </div>
    </div>
  );
}
