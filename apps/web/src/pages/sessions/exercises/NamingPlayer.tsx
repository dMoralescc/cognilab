import { useState, useEffect, useRef, useCallback } from 'react';
import { naming } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function NamingPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => naming.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [responses, setResponses] = useState<naming.NamingResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];
  useEffect(() => { startRef.current = performance.now(); }, [itemIdx]);

  useEffect(() => {
    if (!done) return;
    const s = naming.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosen: string) => {
      if (!currentItem || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { itemId: currentItem.id, response: chosen, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosen === currentItem.correctName ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (itemIdx + 1 >= stimuli.items.length) setDone(true);
        else setItemIdx((i) => i + 1);
      }, 500);
    },
    [currentItem, done, responses, itemIdx, stimuli.items.length],
  );

  if (!currentItem) return null;
  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
        <span>¿Cómo se llama esto?</span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-5 flex h-32 items-center justify-center rounded-2xl border-2 border-gray-200 ${bg}`}>
        <span className="text-7xl">{currentItem.emoji}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentItem.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => respond(opt)}
            disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
