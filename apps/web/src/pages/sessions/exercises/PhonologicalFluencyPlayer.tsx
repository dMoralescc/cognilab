import { useState, useEffect, useRef } from 'react';
import { phonologicalFluency } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function PhonologicalFluencyPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => phonologicalFluency.generate(level, seed));
  const [input, setInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(stimuli.timeLimit);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setDone(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (!done) return;
    const elapsed = Date.now() - startRef.current;
    const s = phonologicalFluency.summarize(stimuli, { words, elapsedMs: elapsed });
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const addWord = () => {
    const w = input.trim();
    if (w && !done) {
      setWords((prev) => [...prev, w]);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addWord(); }
  };

  const progress = 1 - timeLeft / stimuli.timeLimit;

  return (
    <div className="select-none">
      <div className="mb-3 text-center">
        <p className="text-sm text-gray-600 mb-1">Escribe palabras que empiecen por la letra:</p>
        <span className="text-5xl font-extrabold text-indigo-600">{stimuli.letter}</span>
        {stimuli.excludedCategories.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">Excluir: {stimuli.excludedCategories.join(', ')}</p>
        )}
      </div>

      <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${timeLeft <= 10 ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${(1 - progress) * 100}%` }}
        />
      </div>
      <p className="mb-4 text-center text-sm font-semibold text-gray-500">{timeLeft}s restantes</p>

      <div className="mb-4 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={done}
          placeholder={`Palabra con ${stimuli.letter}...`}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:opacity-50"
          autoFocus
        />
        <button
          onClick={addWord}
          disabled={done || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          +
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
            {w}
          </span>
        ))}
      </div>

      {!done && (
        <button
          onClick={() => setDone(true)}
          className="mt-5 w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Finalizar antes ({words.length} palabras)
        </button>
      )}
    </div>
  );
}
