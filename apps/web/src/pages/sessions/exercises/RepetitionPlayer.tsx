import { useState, useEffect, useRef, useCallback } from 'react';
import { repetition } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'show' | 'type' | 'feedback';

export function RepetitionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => repetition.generate(level, seed));
  const [itemIdx, setItemIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('show');
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [responses, setResponses] = useState<repetition.RepetitionResponse>([]);
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState(false);

  const currentItem = stimuli.items[itemIdx];

  useEffect(() => {
    if (phase !== 'show') return;
    const t = setTimeout(() => { setPhase('type'); startRef.current = performance.now(); }, stimuli.displayMs);
    return () => clearTimeout(t);
  }, [phase, itemIdx, stimuli.displayMs]);

  useEffect(() => {
    if (phase === 'type') inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (!done) return;
    const s = repetition.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback(() => {
    if (!currentItem || phase !== 'type') return;
    const rt = Math.round(performance.now() - startRef.current);
    const next = [...responses, { itemId: currentItem.id, typed: typed.trim(), reactionTimeMs: rt }];
    setResponses(next);

    const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '');
    setFeedback(norm(typed) === norm(currentItem.text) ? 'correct' : 'error');
    setPhase('feedback');

    setTimeout(() => {
      setFeedback(null);
      setTyped('');
      if (itemIdx + 1 >= stimuli.items.length) setDone(true);
      else { setItemIdx((i) => i + 1); setPhase('show'); }
    }, 700);
  }, [currentItem, phase, typed, responses, itemIdx, stimuli.items.length]);

  if (!currentItem) return null;

  const TYPE_LABELS: Record<string, string> = { word: 'Repite la palabra', pseudoword: 'Repite la pseudopalabra', sentence: 'Repite la frase' };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>{TYPE_LABELS[currentItem.type] ?? 'Repite'}</span>
        <span className="font-mono">{itemIdx + 1} / {stimuli.items.length}</span>
      </div>

      <div className={`mb-5 flex h-24 items-center justify-center rounded-2xl border-2 border-gray-200 ${feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
        {phase === 'show' ? (
          <p className="text-2xl font-bold text-gray-800">{currentItem.text}</p>
        ) : phase === 'type' ? (
          <p className="text-sm text-gray-400">¿Recuerdas lo que decía?</p>
        ) : (
          <p className="text-lg font-semibold text-gray-600">{currentItem.text}</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          disabled={phase !== 'type'}
          placeholder="Escribe lo que viste..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={submit}
          disabled={phase !== 'type' || !typed.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          OK
        </button>
      </div>
    </div>
  );
}
