import { useState, useEffect, useRef, useCallback } from 'react';
import { prosody } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const EMOTION_EMOJI: Record<string, string> = {
  'alegría': '😊', 'tristeza': '😢', 'enfado': '😠', 'miedo': '😨',
  'sorpresa': '😲', 'disgusto': '🤢', 'sarcasmo': '😒', 'indiferencia': '😐',
};

export function ProsodyPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => prosody.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [responses, setResponses] = useState<prosody.ProsodyResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];
  useEffect(() => { startRef.current = performance.now(); }, [itemIdx]);

  useEffect(() => {
    if (!done) return;
    const s = prosody.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosen: prosody.Emotion) => {
      if (!currentItem || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { itemId: currentItem.id, chosenEmotion: chosen, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosen === currentItem.emotion ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (itemIdx + 1 >= stimuli.items.length) setDone(true);
        else setItemIdx((i) => i + 1);
      }, 600);
    },
    [currentItem, done, responses, itemIdx, stimuli.items.length],
  );

  if (!currentItem) return null;
  const panelBg = feedback === 'correct' ? 'border-green-300 bg-green-50' : feedback === 'error' ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿Qué emoción transmite esta frase?</span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-3 rounded-2xl border-2 p-4 ${panelBg}`}>
        <p className="text-base font-semibold text-gray-800">"{currentItem.sentence}"</p>
        {currentItem.context && (
          <p className="mt-2 text-xs italic text-gray-500">{currentItem.context}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentItem.options.map((opt) => (
          <button
            key={opt}
            onClick={() => respond(opt)}
            disabled={feedback !== null}
            className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <span className="text-xl">{EMOTION_EMOJI[opt] ?? '❓'}</span>
            <span className="capitalize">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
