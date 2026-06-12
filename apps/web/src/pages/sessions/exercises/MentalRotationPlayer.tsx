import { useState, useEffect, useRef, useCallback } from 'react';
import { mentalRotation } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function MentalRotationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => mentalRotation.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<mentalRotation.MentalRotationResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const s = mentalRotation.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (answer: mentalRotation.Answer) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      setResponses((prev) => [...prev, { trialId: currentTrial.id, answer, reactionTimeMs: rt }]);
      setFeedback(answer === currentTrial.correctAnswer ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
        else setTrialIdx((i) => i + 1);
      }, 500);
    },
    [currentTrial, done, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;
  const panelBg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿La figura rotada es igual o imagen en espejo?</span>
        <span className="font-mono">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      <div className={`mb-5 flex h-32 items-center justify-center gap-12 rounded-2xl border-2 ${panelBg}`}>
        {/* Original figure */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl">{currentTrial.figure}</span>
          <span className="text-xs text-gray-400">Original</span>
        </div>
        {/* Rotated figure */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-5xl inline-block"
            style={{ transform: `rotate(${currentTrial.rotationAngle}deg) ${currentTrial.isMirror ? 'scaleX(-1)' : ''}` }}
          >
            {currentTrial.figure}
          </span>
          <span className="text-xs text-gray-400">{currentTrial.rotationAngle}°</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => respond('same')}
          disabled={feedback !== null}
          className="rounded-xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          ↩ Igual (rotada)
        </button>
        <button
          onClick={() => respond('mirror')}
          disabled={feedback !== null}
          className="rounded-xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          ↔ Espejo
        </button>
      </div>
    </div>
  );
}
