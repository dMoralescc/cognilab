import { useState, useEffect } from 'react';
import { attentionSpan } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const TOTAL_ROUNDS = 5;
type Phase = 'expose' | 'recall' | 'feedback';

export function AttentionSpanPlayer({ level, seed, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [content, setContent] = useState(() => attentionSpan.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('expose');
  const [selected, setSelected] = useState<number[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const { stimuli } = content;
  const total = stimuli.gridSize * stimuli.gridSize;
  const targetSet = new Set(stimuli.targetPositions);

  // Auto-hide after exposure time
  useEffect(() => {
    if (phase !== 'expose') return;
    const timer = setTimeout(() => setPhase('recall'), stimuli.exposureTimeMs);
    return () => clearTimeout(timer);
  }, [phase, stimuli.exposureTimeMs, round]);

  const toggle = (idx: number) => {
    if (phase !== 'recall') return;
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const confirm = () => {
    const summary = attentionSpan.summarize(stimuli, selected);
    const correct = summary.errors === 0;
    setLastCorrect(correct);
    setTotalHits((h) => h + summary.hits);
    setTotalErrors((e) => e + summary.errors);
    setPhase('feedback');
  };

  const nextRound = () => {
    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      onComplete({
        hits: totalHits + (lastCorrect ? 1 : 0),
        errors: totalErrors,
        reactionTimeMs: null,
        rawData: { rounds: TOTAL_ROUNDS, level },
      });
      return;
    }
    setRound(nextRound);
    setContent(attentionSpan.generate(level, seed + nextRound * 1000));
    setSelected([]);
    setLastCorrect(null);
    setPhase('expose');
  };

  return (
    <div className="select-none space-y-4">
      {/* Round indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Ronda <span className="text-indigo-600">{round + 1}</span> de {TOTAL_ROUNDS}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${
                i < round ? 'bg-green-400' : i === round ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Instruction */}
      <p className="text-center text-sm text-gray-500">
        {phase === 'expose'
          ? `Memoriza las ${stimuli.targetPositions.length} casillas iluminadas`
          : phase === 'recall'
          ? 'Selecciona las casillas que se iluminaron'
          : lastCorrect ? '¡Correcto!' : 'No del todo… continúa'}
      </p>

      {/* Grid */}
      <div
        className="mx-auto grid gap-2"
        style={{ gridTemplateColumns: `repeat(${stimuli.gridSize}, minmax(0, 1fr))`, maxWidth: `${stimuli.gridSize * 60}px` }}
      >
        {Array.from({ length: total }, (_, idx) => {
          const isTarget = targetSet.has(idx);
          const isSelected = selected.includes(idx);

          let cellClass = 'bg-gray-100 border-gray-200';

          if (phase === 'expose') {
            cellClass = isTarget
              ? 'bg-indigo-500 border-indigo-400 scale-105 shadow-md shadow-indigo-200'
              : 'bg-gray-100 border-gray-200';
          } else if (phase === 'recall') {
            cellClass = isSelected
              ? 'bg-indigo-500 border-indigo-400 scale-105'
              : 'bg-gray-100 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300';
          } else {
            // feedback
            if (isTarget && isSelected) cellClass = 'bg-green-400 border-green-300';
            else if (isTarget && !isSelected) cellClass = 'bg-red-300 border-red-300 animate-pulse';
            else if (!isTarget && isSelected) cellClass = 'bg-orange-300 border-orange-300';
            else cellClass = 'bg-gray-100 border-gray-200';
          }

          return (
            <button
              key={idx}
              onClick={() => toggle(idx)}
              disabled={phase !== 'recall'}
              className={`h-12 w-full rounded-xl border-2 transition-all ${cellClass}`}
            />
          );
        })}
      </div>

      {/* Actions */}
      {phase === 'recall' && (
        <div className="flex justify-center">
          <button
            onClick={confirm}
            disabled={selected.length === 0}
            className="rounded-2xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
          >
            Confirmar ✓
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="flex flex-col items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${lastCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
            {lastCorrect ? '✅' : '❌'}
          </div>
          <button
            onClick={nextRound}
            className="rounded-2xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
          >
            {round + 1 >= TOTAL_ROUNDS ? 'Ver resultado' : 'Siguiente ronda →'}
          </button>
        </div>
      )}
    </div>
  );
}
