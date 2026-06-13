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
  const [stimKey, setStimKey] = useState(0);

  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, reactionTimeMs: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, reactionTimeMs }]);
      const correct = responded === currentTrial.isGo;
      setFeedback(correct ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 350);
      if (trialIdx + 1 >= total) {
        setPhase('done');
      } else {
        setTrialIdx((i) => i + 1);
        setPhase('isi');
      }
    },
    [currentTrial, trialIdx, total],
  );

  useEffect(() => {
    if (!currentTrial) return;
    if (phase === 'isi') {
      const timer = setTimeout(() => {
        respondedRef.current = false;
        stimulusStartRef.current = performance.now();
        setStimKey((k) => k + 1);
        setPhase('stimulus');
      }, currentTrial.isiMs);
      return () => clearTimeout(timer);
    }
    if (phase === 'stimulus') {
      const timer = setTimeout(() => {
        if (!respondedRef.current) finishTrial(false, 0);
      }, stimuli.stimulusDurationMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, currentTrial, stimuli.stimulusDurationMs, finishTrial]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = goNoGo.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (phase !== 'stimulus' || respondedRef.current) return;
    respondedRef.current = true;
    finishTrial(true, Math.round(performance.now() - stimulusStartRef.current));
  };

  const isGo = currentTrial?.isGo ?? false;
  const flashClass = feedback === 'correct' ? 'animate-flash-correct' : feedback === 'error' ? 'animate-flash-error' : '';

  const stimulusArea =
    phase === 'stimulus' && currentTrial ? (
      <div key={stimKey} className={`flex h-full w-full items-center justify-center rounded-2xl transition-colors ${isGo ? 'bg-green-50' : 'bg-red-50'}`}>
        <span className={`animate-pop-in text-8xl font-bold ${isGo ? 'text-green-500' : 'text-red-500'}`}>
          {currentTrial.symbol}
        </span>
      </div>
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <span className="animate-fixation text-5xl font-light text-gray-300">+</span>
      </div>
    );

  return (
    <div className="select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="text-base">{stimuli.goSymbol}</span> PULSA
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
            <span className="text-base">{stimuli.noGoSymbol}</span> NO PULSES
          </span>
        </div>
        <span className="font-mono text-xs text-gray-400">{trialIdx + 1} / {total}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      {/* Stimulus zone */}
      <button
        onClick={handleTap}
        className={`h-72 w-full overflow-hidden rounded-2xl border-2 transition-colors ${
          phase === 'stimulus' && isGo
            ? 'border-green-300 animate-glow-pulse'
            : phase === 'stimulus'
            ? 'border-red-300'
            : 'border-gray-200'
        } ${flashClass}`}
      >
        {stimulusArea}
      </button>

      {/* Status hint */}
      <p className="text-center text-xs text-gray-400">
        {phase === 'stimulus'
          ? currentTrial?.isGo
            ? '▶ Pulsa ahora'
            : '✋ No pulses'
          : 'Espera el estímulo…'}
      </p>

      {/* Trial dots */}
      <div className="flex justify-center gap-1 pt-1">
        {Array.from({ length: Math.min(total, 20) }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i < trialIdx ? 'bg-indigo-400' : i === trialIdx ? 'bg-indigo-600 scale-125' : 'bg-gray-200'
            }`}
          />
        ))}
        {total > 20 && <span className="text-xs text-gray-300">…</span>}
      </div>
    </div>
  );
}
