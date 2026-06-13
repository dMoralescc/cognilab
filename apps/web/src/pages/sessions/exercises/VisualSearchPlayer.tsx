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
const TOTAL_ROUNDS = 5;

export function VisualSearchPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [content, setContent] = useState(() => visualSearch.generate(level, seed));
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'search' | 'feedback'>('search');
  const [totalHits, setTotalHits] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [roundStartMs] = useState(() => performance.now());
  const [roundRts, setRoundRts] = useState<number[]>([]);

  const { stimuli } = content;

  const handleClick = (id: number) => {
    if (phase !== 'search') return;
    setSelected((prev) => (prev === id ? null : id));
  };

  const handleConfirm = () => {
    if (phase !== 'search') return;
    const rt = Math.round(performance.now() - roundStartMs);
    const summary = visualSearch.summarize(stimuli, { selectedId: selected, reactionTimeMs: rt });
    const correct = summary.hits === 1;
    setLastCorrect(correct);
    setTotalHits((h) => h + summary.hits);
    setTotalErrors((e) => e + summary.errors);
    setRoundRts((prev) => [...prev, rt]);
    setPhase('feedback');
  };

  const nextRound = () => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS) {
      const meanRt = roundRts.length > 0
        ? Math.round(roundRts.reduce((a, b) => a + b, 0) / roundRts.length)
        : null;
      onComplete({
        hits: totalHits,
        errors: totalErrors,
        reactionTimeMs: meanRt,
        rawData: { rounds: TOTAL_ROUNDS },
      });
      return;
    }
    setRound(next);
    setContent(visualSearch.generate(level, seed + next * 1000));
    setSelected(null);
    setLastCorrect(null);
    setPhase('search');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 px-4 py-2.5">
          <p className="text-sm font-semibold text-indigo-900">Encuentra</p>
          <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <ShapeIcon shape={stimuli.target} size={22} color="#374151" strokeWidth={2.5} />
          </span>
          <p className="text-sm font-semibold text-indigo-900">entre todos</p>
        </div>

        {/* Round dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i < round ? 'bg-green-400' : i === round ? 'bg-indigo-500 scale-125' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        className={`relative mx-auto overflow-hidden rounded-2xl border-4 transition-colors duration-300 ${
          phase === 'feedback'
            ? lastCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
            : 'border-gray-100 bg-gray-50'
        }`}
        style={{ width: '100%', paddingBottom: '62%' }}
      >
        {stimuli.items.map((item) => {
          const isSelected = selected === item.id;
          const isTarget = item.isTarget;
          let cellClass = 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:scale-110 active:scale-95';
          if (phase === 'feedback') {
            if (isTarget) cellClass = 'border-green-500 bg-green-100 scale-125 shadow-lg shadow-green-200';
            else if (isSelected) cellClass = 'border-red-400 bg-red-100';
            else cellClass = 'border-gray-100 bg-white opacity-40';
          } else if (isSelected) {
            cellClass = 'border-indigo-500 bg-indigo-100 scale-125 shadow-lg shadow-indigo-200';
          }

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              disabled={phase === 'feedback'}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                transform: 'translate(-50%,-50%)',
              }}
              className={`flex items-center justify-center rounded-2xl border-2 transition-all select-none ${cellClass}`}
            >
              <ShapeIcon
                shape={item.symbol}
                size={ICON_SIZE}
                color={
                  phase === 'feedback' && isTarget ? '#16a34a' :
                  phase === 'feedback' && isSelected ? '#dc2626' :
                  isSelected ? '#4338ca' : '#374151'
                }
                strokeWidth={2.5}
              />
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {phase === 'search' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {selected === null ? 'Toca la figura correcta' : '¡Seleccionada! Confirma cuando estés seguro'}
          </p>
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
          >
            Confirmar ✓
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{lastCorrect ? '✅' : '❌'}</span>
            <span className={`text-sm font-semibold ${lastCorrect ? 'text-green-700' : 'text-red-600'}`}>
              {lastCorrect ? '¡Correcto!' : 'Era la otra figura'}
            </span>
          </div>
          <button
            onClick={nextRound}
            className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
          >
            {round + 1 >= TOTAL_ROUNDS ? 'Ver resultado' : 'Siguiente →'}
          </button>
        </div>
      )}
    </div>
  );
}
