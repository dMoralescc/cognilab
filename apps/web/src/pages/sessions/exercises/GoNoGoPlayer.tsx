import { useState, useEffect, useRef, useCallback } from 'react';
import { goNoGo } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'isi' | 'stimulus' | 'done';

export function GoNoGoPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => goNoGo.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [responses, setResponses] = useState<goNoGo.GoNoGoResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);

  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, reactionTimeMs: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [
        ...prev,
        { trialId: currentTrial.id, responded, reactionTimeMs },
      ]);

      const correct = responded === currentTrial.isGo;
      setFeedback(correct ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 300);

      if (trialIdx + 1 >= total) {
        setPhase('done');
      } else {
        setTrialIdx((i) => i + 1);
        setPhase('isi');
      }
    },
    [currentTrial, trialIdx, total],
  );

  // ISI → stimulus timing
  useEffect(() => {
    if (!currentTrial) return;
    if (phase === 'isi') {
      const timer = setTimeout(() => {
        respondedRef.current = false;
        stimulusStartRef.current = performance.now();
        setPhase('stimulus');
      }, currentTrial.isiMs);
      return () => clearTimeout(timer);
    }
    if (phase === 'stimulus') {
      const timer = setTimeout(() => {
        if (!respondedRef.current) {
          finishTrial(false, 0);
        }
      }, stimuli.stimulusDurationMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, currentTrial, stimuli.stimulusDurationMs, finishTrial]);

  // Submit when done
  useEffect(() => {
    if (phase !== 'done') return;
    const finalResponses = [...responses];
    const summary = goNoGo.summarize(stimuli, finalResponses);
    onComplete({
      hits: summary.hits,
      errors: summary.errors,
      reactionTimeMs: summary.reactionTimeMs,
      rawData: summary.rawData,
    });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (phase !== 'stimulus' || respondedRef.current) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, rt);
  };

  const bgColor =
    feedback === 'correct' ? 'bg-green-100' :
    feedback === 'error' ? 'bg-red-100' : 'bg-gray-50';

  return (
    <div className="select-none">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          Pulsa <span className="font-bold text-green-600">{stimuli.goSymbol}</span> · No pulses{' '}
          <span className="font-bold text-red-500">{stimuli.noGoSymbol}</span>
        </span>
        <span className="font-mono text-gray-400">
          {trialIdx + 1} / {total}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${(trialIdx / total) * 100}%` }}
        />
      </div>

      {/* Stimulus area */}
      <button
        onClick={handleTap}
        className={`flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 transition-colors ${bgColor}`}
      >
        {phase === 'stimulus' && currentTrial ? (
          <span
            className={`text-8xl font-bold transition-all ${
              currentTrial.isGo ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {currentTrial.symbol}
          </span>
        ) : (
          <span className="text-3xl text-gray-300">+</span>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        {phase === 'stimulus' ? 'Pulsa si es la señal GO' : 'Espera...'}
      </p>
    </div>
  );
}
