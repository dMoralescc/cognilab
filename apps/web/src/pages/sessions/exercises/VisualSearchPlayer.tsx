import { useState } from 'react';
import { visualSearch } from '@cognilab/shared';
import { ShapeIcon } from './ShapeIcon';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const ITEM_SIZE = 48;
const ICON_SIZE = 28;

export function VisualSearchPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [{ stimuli }] = useState(() => visualSearch.generate(level, seed));
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = (id: number) => {
    if (confirmed) return;
    setSelected((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (confirmed) return;
    setConfirmed(true);
    const summary = visualSearch.summarize(stimuli, { selectedId: selected, reactionTimeMs: elapsedMs });
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-5 py-3">
        <p className="text-sm font-semibold text-indigo-900">Encuentra y toca</p>
        <span className="inline-flex items-center justify-center rounded-xl bg-white p-2 shadow-sm">
          <ShapeIcon shape={stimuli.target} size={24} color="#374151" strokeWidth={2.5} />
        </span>
        <p className="text-sm font-semibold text-indigo-900">entre todos los demás</p>
      </div>

      {/* Canvas */}
      <div
        className="relative mx-auto overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50"
        style={{ width: '100%', paddingBottom: '62%' }}
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
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                transform: 'translate(-50%,-50%)',
              }}
              className={`flex items-center justify-center rounded-2xl border-2 transition-all select-none
                ${isSelected
                  ? 'border-indigo-500 bg-indigo-100 scale-125 shadow-lg shadow-indigo-200'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:scale-110 active:scale-95'}
              `}
            >
              <ShapeIcon
                shape={item.symbol}
                size={ICON_SIZE}
                color={isSelected ? '#4338ca' : '#374151'}
                strokeWidth={2.5}
              />
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {selected === null ? 'Toca la figura correcta' : '¡Seleccionada! Confirma cuando estés seguro'}
        </p>
        <button
          onClick={handleConfirm}
          disabled={selected === null || confirmed}
          className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
        >
          Confirmar ✓
        </button>
      </div>
    </div>
  );
}
