import { useState, useEffect, useRef, useCallback } from 'react';
import { depthPerception } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function DepthPerceptionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => depthPerception.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [order, setOrder] = useState<number[]>([]);  // zIndices in user-chosen order (nearest first)
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [responses, setResponses] = useState<depthPerception.DepthPerceptionResponse>([]);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];
  useEffect(() => { startRef.current = performance.now(); setOrder([]); }, [itemIdx]);

  useEffect(() => {
    if (!done) return;
    const s = depthPerception.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToOrder = useCallback(
    (zIndex: number) => {
      if (!currentItem || feedback !== null) return;
      if (order.includes(zIndex)) return;
      const newOrder = [...order, zIndex];
      setOrder(newOrder);
      if (newOrder.length === currentItem.objects.length) {
        const rt = Math.round(performance.now() - startRef.current);
        const next = [...responses, { itemId: currentItem.id, chosenOrder: newOrder, reactionTimeMs: rt }];
        setResponses(next);
        const correct = currentItem.correctOrder;
        const isCorrect = correct.every((v, i) => v === newOrder[i]);
        setFeedback(isCorrect ? 'correct' : 'error');
        setTimeout(() => {
          setFeedback(null);
          if (itemIdx + 1 >= stimuli.items.length) setDone(true);
          else setItemIdx((i) => i + 1);
        }, 700);
      }
    },
    [currentItem, order, feedback, responses, itemIdx, stimuli.items.length],
  );

  if (!currentItem) return null;
  const panelBg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>Toca los objetos de más cercano a más lejano</span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-5 relative flex h-40 items-end justify-around rounded-2xl border-2 p-4 pb-2 ${panelBg}`}>
        {currentItem.objects.map((obj, i) => (
          <button
            key={i}
            onClick={() => addToOrder(obj.zIndex)}
            disabled={order.includes(obj.zIndex) || feedback !== null}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
              order.includes(obj.zIndex) ? 'border-indigo-400 bg-indigo-50 opacity-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <span style={{ fontSize: `${obj.size * 1.5}rem`, opacity: obj.opacity }}>{obj.emoji}</span>
            {order.includes(obj.zIndex) && (
              <span className="text-xs font-bold text-indigo-600">#{order.indexOf(obj.zIndex) + 1}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2">
        {currentItem.objects.map((_, i) => (
          <div key={i} className={`h-2 w-8 rounded-full ${i < order.length ? 'bg-indigo-500' : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-gray-400">
        {order.length === 0 ? 'Toca el objeto más cercano primero' : `${order.length} de ${currentItem.objects.length} seleccionados`}
      </p>
    </div>
  );
}
