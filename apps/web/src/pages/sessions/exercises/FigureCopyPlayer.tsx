import { useState, useEffect, useRef } from 'react';
import { figureCopy } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function FigureCopyPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => figureCopy.generate(level, seed));
  const [correctElements, setCorrectElements] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const startRef = useRef(Date.now());
  const total = stimuli.elements.length;

  useEffect(() => {
    if (!submitted) return;
    const elapsed = Date.now() - startRef.current;
    const s = figureCopy.summarize(stimuli, { correctElements, totalElements: total, elapsedMs: elapsed });
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render a simple dot-grid preview of the figure
  const gridSz = stimuli.gridSize;

  return (
    <div className="select-none text-center">
      <p className="mb-2 text-sm font-semibold text-gray-700">{stimuli.figureName}</p>
      <p className="mb-4 text-xs text-gray-400">Copia la figura en papel, luego indica cuántos elementos reprodujiste correctamente.</p>

      {/* Dot grid visual guide */}
      <div
        className="mx-auto mb-5 inline-grid gap-4 rounded-xl border-2 border-gray-200 bg-white p-4"
        style={{ gridTemplateColumns: `repeat(${gridSz}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: gridSz * gridSz }, (_, i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-gray-400 mx-auto" />
        ))}
      </div>

      <p className="mb-3 text-sm text-gray-600">La figura tiene <strong>{total}</strong> elemento{total !== 1 ? 's' : ''}.</p>
      <p className="mb-3 text-xs text-gray-400">¿Cuántos dibujaste correctamente?</p>

      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setCorrectElements((c) => Math.max(0, c - 1))}
          disabled={submitted}
          className="h-10 w-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:bg-gray-50 disabled:opacity-40"
        >−</button>
        <span className="text-3xl font-bold text-indigo-600">{correctElements}</span>
        <button
          onClick={() => setCorrectElements((c) => Math.min(total, c + 1))}
          disabled={submitted}
          className="h-10 w-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:bg-gray-50 disabled:opacity-40"
        >+</button>
      </div>

      <button
        onClick={() => setSubmitted(true)}
        disabled={submitted}
        className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
      >
        Finalizar copia
      </button>
    </div>
  );
}
