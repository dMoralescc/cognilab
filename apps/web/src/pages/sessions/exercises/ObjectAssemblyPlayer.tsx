import { useState, useEffect, useRef, useCallback } from 'react';
import { objectAssembly } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function ObjectAssemblyPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => objectAssembly.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [responses, setResponses] = useState<objectAssembly.ObjectAssemblyResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];
  useEffect(() => { startRef.current = performance.now(); }, [itemIdx]);

  useEffect(() => {
    if (!done) return;
    const s = objectAssembly.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (identified: boolean) => {
      if (!currentItem || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { itemId: currentItem.id, identified, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(identified ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (itemIdx + 1 >= stimuli.items.length) setDone(true);
        else setItemIdx((i) => i + 1);
      }, 600);
    },
    [currentItem, done, responses, itemIdx, stimuli.items.length],
  );

  if (!currentItem) return null;
  const panelBg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿Qué objeto forman estas piezas?</span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-5 rounded-2xl border-2 p-5 ${panelBg}`}>
        <div className="mb-3 flex flex-wrap justify-center gap-3">
          {currentItem.parts.map((part) => (
            <span
              key={part.id}
              className="inline-block text-4xl"
              style={{ transform: `rotate(${part.rotation}deg)` }}
            >
              {part.emoji}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400">Estas piezas forman un objeto. ¿Puedes identificarlo?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => respond(true)}
          disabled={feedback !== null}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 py-4 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
        >
          ✓ Sí lo identifico
        </button>
        <button
          onClick={() => respond(false)}
          disabled={feedback !== null}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-4 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
        >
          ✕ No lo identifico
        </button>
      </div>

      {feedback === 'correct' && (
        <p className="mt-3 text-center text-sm font-semibold text-green-600">¡Correcto! Era: {currentItem.targetEmoji} {currentItem.targetName}</p>
      )}
      {feedback === 'error' && (
        <p className="mt-3 text-center text-sm text-gray-500">Era: {currentItem.targetEmoji} {currentItem.targetName}</p>
      )}
    </div>
  );
}
