import { useState, useEffect, useRef, useCallback } from 'react';
import { categorization } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function CategorizationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => categorization.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<categorization.CategorizationResponse>([]);
  const [_feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = categorization.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { trialId: currentTrial.id, chosenIndex, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosenIndex === currentTrial.oddIndex ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 250);
      if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, done, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>¿Cuál no pertenece a la categoría?</span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / stimuli.trials.length) * 100}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {currentTrial.items.map((item, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            className="h-16 rounded-xl border-2 border-gray-200 bg-white text-lg font-semibold text-gray-700 hover:bg-gray-50 capitalize"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
