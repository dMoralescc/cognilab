import { useState, useEffect, useRef, useCallback } from 'react';
import { nonverbalCommunication } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function NonverbalCommunicationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => nonverbalCommunication.generate(level, seed));
  const [tIdx, setTIdx] = useState(0);
  const [responses, setResponses] = useState<nonverbalCommunication.NonverbalCommunicationResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const tr = stimuli.trials[tIdx];
  useEffect(() => { startRef.current = performance.now(); }, [tIdx]);
  useEffect(() => {
    if (!done) return;
    const s = nonverbalCommunication.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback((idx: number) => {
    if (!tr || done) return;
    const rt = Math.round(performance.now() - startRef.current);
    setResponses(prev => [...prev, { trialId: tr.id, chosenIndex: idx, reactionTimeMs: rt }]);
    setFeedback(idx === tr.correctIndex ? 'correct' : 'error');
    setTimeout(() => { setFeedback(null); if (tIdx + 1 >= stimuli.trials.length) setDone(true); else setTIdx(i => i + 1); }, 500);
  }, [tr, done, tIdx, stimuli.trials.length]);

  if (!tr) return null;
  const bg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';
  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿Qué comunica este gesto o expresión?</span>
        <span className="font-mono">{tIdx + 1} / {stimuli.trials.length}</span>
      </div>
      <div className={`mb-5 flex flex-col items-center gap-2 rounded-2xl border-2 p-5 ${bg}`}>
        <span className="text-7xl">{tr.emoji}</span>
        <p className="text-sm text-gray-600 text-center">{tr.description}</p>
        <p className="font-semibold text-gray-900 text-center">{tr.question}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {tr.options.map((opt, i) => (
          <button key={i} onClick={() => respond(i)} disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">{opt}</button>
        ))}
      </div>
    </div>
  );
}
