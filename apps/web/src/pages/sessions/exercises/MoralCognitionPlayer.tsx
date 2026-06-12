import { useState, useEffect, useRef, useCallback } from 'react';
import { moralCognition } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function MoralCognitionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => moralCognition.generate(level, seed));
  const [dIdx, setDIdx] = useState(0);
  const [responses, setResponses] = useState<moralCognition.MoralCognitionResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const d = stimuli.dilemmas[dIdx];
  useEffect(() => { startRef.current = performance.now(); setShowReasoning(false); }, [dIdx]);
  useEffect(() => {
    if (!done) return;
    const s = moralCognition.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback((idx: number) => {
    if (!d || done) return;
    const rt = Math.round(performance.now() - startRef.current);
    setResponses(prev => [...prev, { dilemmaId: d.id, chosenIndex: idx, reactionTimeMs: rt }]);
    setFeedback(idx === d.correctIndex ? 'correct' : 'error');
    setShowReasoning(true);
    setTimeout(() => {
      setFeedback(null); setShowReasoning(false);
      if (dIdx + 1 >= stimuli.dilemmas.length) setDone(true); else setDIdx(i => i + 1);
    }, 1500);
  }, [d, done, dIdx, stimuli.dilemmas.length]);

  if (!d) return null;
  const bg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';
  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>Razonamiento moral</span>
        <span className="font-mono">{dIdx + 1} / {stimuli.dilemmas.length}</span>
      </div>
      <div className={`mb-4 rounded-2xl border-2 p-4 ${bg}`}>
        <p className="mb-2 text-sm text-gray-700">{d.scenario}</p>
        <p className="mb-3 text-xs text-gray-500 italic">Acción: "{d.action}"</p>
        <p className="font-semibold text-gray-900">{d.question}</p>
        {showReasoning && <p className="mt-3 text-xs text-indigo-600">{d.reasoning}</p>}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {d.options.map((opt, i) => (
          <button key={i} onClick={() => respond(i)} disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">{opt}</button>
        ))}
      </div>
    </div>
  );
}
