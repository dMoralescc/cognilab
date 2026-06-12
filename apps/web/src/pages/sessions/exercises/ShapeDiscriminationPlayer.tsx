import { useState, useEffect, useRef, useCallback } from 'react';
import { shapeDiscrimination } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function ShapeDiscriminationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => shapeDiscrimination.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<shapeDiscrimination.ShapeDiscriminationResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const s = shapeDiscrimination.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      setResponses((prev) => [...prev, { trialId: currentTrial.id, chosenIndex, reactionTimeMs: rt }]);
      setFeedback(chosenIndex === currentTrial.correctIndex ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
        else setTrialIdx((i) => i + 1);
      }, 400);
    },
    [currentTrial, done, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;
  const panelBg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿Cuál de las opciones es idéntica al modelo?</span>
        <span className="font-mono">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      <div className={`mb-5 flex h-28 items-center justify-center rounded-2xl border-2 ${panelBg}`}>
        <span className="text-6xl font-bold text-gray-700">{currentTrial.target}</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {currentTrial.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            disabled={feedback !== null}
            className="flex h-16 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-3xl hover:bg-gray-50 disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
