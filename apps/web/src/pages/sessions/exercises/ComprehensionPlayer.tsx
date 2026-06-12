import { useState, useEffect, useRef, useCallback } from 'react';
import { comprehension } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function ComprehensionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => comprehension.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [responses, setResponses] = useState<comprehension.ComprehensionResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];
  useEffect(() => { startRef.current = performance.now(); }, [itemIdx]);

  useEffect(() => {
    if (!done) return;
    const s = comprehension.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      if (!currentItem || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { itemId: currentItem.id, chosenIndex, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosenIndex === currentItem.correctIndex ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (itemIdx + 1 >= stimuli.items.length) setDone(true);
        else setItemIdx((i) => i + 1);
      }, 600);
    },
    [currentItem, done, responses, itemIdx, stimuli.items.length],
  );

  if (!currentItem) return null;
  const TYPE_LABEL = { command: 'Señala la opción correcta', question: 'Responde la pregunta' };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 font-medium">
          {TYPE_LABEL[currentItem.taskType]}
        </span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-5 rounded-2xl border-2 border-gray-200 p-5 ${feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
        <p className="text-base font-medium text-gray-800">{currentItem.stimulus}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {currentItem.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
