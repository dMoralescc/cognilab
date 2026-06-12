import { useState, useEffect, useRef, useCallback } from 'react';
import { vigilance } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function VigilancePlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => vigilance.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<vigilance.VigilanceResponse>([]);
  const [showStimulus, setShowStimulus] = useState(false);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | 'fa' | null>(null);
  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, reactionTimeMs: rt }]);
      if (responded && currentTrial.isSignal) setFeedback('hit');
      else if (!responded && currentTrial.isSignal) setFeedback('miss');
      else if (responded && !currentTrial.isSignal) setFeedback('fa');
      else setFeedback(null);
      setTimeout(() => setFeedback(null), 400);
      setShowStimulus(false);
      if (trialIdx + 1 >= total) return; // trigger done in useEffect
      setTrialIdx((i) => i + 1);
    },
    [currentTrial, trialIdx, total],
  );

  // Sequence: show stimulus → wait for response → auto-advance
  useEffect(() => {
    if (!currentTrial) return;
    respondedRef.current = false;
    stimulusStartRef.current = performance.now();
    setShowStimulus(true);
    const t = setTimeout(() => {
      if (!respondedRef.current) finishTrial(false, 0);
    }, currentTrial.durationMs);
    return () => clearTimeout(t);
  }, [trialIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Done
  useEffect(() => {
    if (trialIdx + 1 < total || responses.length === 0) return;
    const finalResponses = responses;
    const summary = vigilance.summarize(stimuli, finalResponses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [responses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, rt);
  };

  const feedbackBg = feedback === 'hit' ? 'bg-green-50' : feedback === 'fa' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>
          Pulsa <strong className="text-yellow-600">{stimuli.signalSymbol}</strong> · No pulses{' '}
          <strong className="text-gray-400">{stimuli.noiseSymbol}</strong>
        </span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-yellow-400 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <button
        onClick={handleTap}
        className={`flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 transition-colors ${feedbackBg}`}
      >
        {showStimulus && currentTrial ? (
          <span className={`text-8xl font-bold ${currentTrial.isSignal ? 'text-yellow-500' : 'text-gray-400'}`}>
            {currentTrial.symbol}
          </span>
        ) : (
          <span className="text-3xl text-gray-200">·</span>
        )}
      </button>

      <p className="mt-2 text-center text-xs text-gray-400">
        {feedback === 'hit' ? '✓ Señal detectada' : feedback === 'fa' ? '✗ Falsa alarma' : feedback === 'miss' ? '✗ Omisión' : 'Mantén la atención...'}
      </p>
    </div>
  );
}
