import { useState, useEffect, useRef, useCallback } from 'react';
import { theoryOfMind } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const TASK_LABELS: Record<string, string> = { belief: 'Creencias', faux_pas: 'Metedura de pata', irony: 'Ironía' };

export function TheoryOfMindPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => theoryOfMind.generate(level, seed));
  const [sIdx, setSIdx] = useState(0);
  const [responses, setResponses] = useState<theoryOfMind.TheoryOfMindResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const sc = stimuli.scenarios[sIdx];
  useEffect(() => { startRef.current = performance.now(); }, [sIdx]);
  useEffect(() => {
    if (!done) return;
    const s = theoryOfMind.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback((idx: number) => {
    if (!sc || done) return;
    const rt = Math.round(performance.now() - startRef.current);
    setResponses(prev => [...prev, { scenarioId: sc.id, chosenIndex: idx, reactionTimeMs: rt }]);
    setFeedback(idx === sc.correctIndex ? 'correct' : 'error');
    setTimeout(() => { setFeedback(null); if (sIdx + 1 >= stimuli.scenarios.length) setDone(true); else setSIdx(i => i + 1); }, 700);
  }, [sc, done, sIdx, stimuli.scenarios.length]);

  if (!sc) return null;
  const bg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';
  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-600 font-medium">{TASK_LABELS[sc.taskType] ?? 'Teoría de la mente'} · Orden {sc.order}</span>
        <span className="font-mono">{sIdx + 1} / {stimuli.scenarios.length}</span>
      </div>
      <div className={`mb-4 rounded-2xl border-2 p-4 ${bg}`}>
        <p className="mb-3 text-sm text-gray-700 leading-relaxed">{sc.story}</p>
        <p className="font-semibold text-gray-900">{sc.question}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {sc.options.map((opt, i) => (
          <button key={i} onClick={() => respond(i)} disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">{opt}</button>
        ))}
      </div>
    </div>
  );
}
