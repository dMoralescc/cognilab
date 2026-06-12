import { useState, useEffect, useRef } from 'react';
import { designFluency } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function DesignFluencyPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [{ stimuli }] = useState(() => designFluency.generate(level, seed));
  const [count, setCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const startRef = useRef(Date.now());

  const timeLeft = Math.max(0, stimuli.timeLimit - Math.floor(elapsedMs / 1000));

  useEffect(() => {
    if (timeLeft === 0 && !submitted) setSubmitted(true);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (!submitted) return;
    const elapsed = Date.now() - startRef.current;
    const summary = designFluency.summarize(stimuli, { designCount: count, elapsedMs: elapsed });
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const CONSTRAINT_LABELS: Record<string, string> = {
    any: 'Cualquier línea', straight: 'Solo líneas rectas', curved: 'Solo líneas curvas',
  };

  return (
    <div className="select-none text-center">
      <p className="mb-2 text-sm text-gray-600">
        Dibuja figuras distintas uniendo puntos del grid<br />
        <span className="text-xs text-gray-400">{CONSTRAINT_LABELS[stimuli.lineConstraint]}</span>
      </p>

      {/* Dot grid (visual only — we count designs manually) */}
      <div className={`mx-auto mb-5 grid gap-4 rounded-xl border-2 border-gray-200 bg-white p-6`}
        style={{ gridTemplateColumns: `repeat(${stimuli.gridSize}, minmax(0, 1fr))`, width: `${stimuli.gridSize * 48}px` }}>
        {Array.from({ length: stimuli.gridSize * stimuli.gridSize }, (_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-gray-400 mx-auto" />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          disabled={submitted}
          className="h-10 w-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:bg-gray-50 disabled:opacity-40"
        >−</button>
        <span className="text-3xl font-bold text-indigo-600">{count}</span>
        <button
          onClick={() => setCount((c) => c + 1)}
          disabled={submitted}
          className="h-10 w-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:bg-gray-50 disabled:opacity-40"
        >+</button>
      </div>
      <p className="mb-4 text-xs text-gray-500">Cuenta cuántos diseños distintos has dibujado</p>

      <button
        onClick={() => setSubmitted(true)}
        disabled={submitted || count === 0}
        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
      >
        Finalizar ({timeLeft}s restantes)
      </button>
    </div>
  );
}
