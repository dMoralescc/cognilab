import { useState, useEffect, useRef, useCallback } from 'react';
import { inhibition } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function InhibitionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => inhibition.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [responses, setResponses] = useState<inhibition.InhibitionResponse>([]);
  const respondedRef = useRef(false);
  const stimulusStartRef = useRef(0);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, reactionTimeMs: rt }]);
      setShowStimulus(false); setShowStop(false);
      if (trialIdx + 1 >= total) return;
      setTimeout(() => setTrialIdx((i) => i + 1), 300);
    },
    [currentTrial, trialIdx, total],
  );

  useEffect(() => {
    if (!currentTrial) return;
    respondedRef.current = false;
    const isiTimer = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setShowStimulus(true);
      if (currentTrial.hasStopSignal) {
        setTimeout(() => setShowStop(true), currentTrial.stopSignalDelayMs);
      }
      const autoTimer = setTimeout(() => {
        if (!respondedRef.current) finishTrial(false, 0);
        setShowStimulus(false); setShowStop(false);
      }, stimuli.goDurationMs);
      return () => clearTimeout(autoTimer);
    }, currentTrial.goDelayMs);
    return () => clearTimeout(isiTimer);
  }, [trialIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (trialIdx + 1 < total || responses.length === 0) return;
    const summary = inhibition.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [responses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (respondedRef.current || !showStimulus) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, rt);
  };

  const bg = showStop ? 'bg-red-50' : showStimulus ? 'bg-green-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>Pulsa <strong className="text-green-600">{inhibition.GO_STIMULUS}</strong> — No pulses si aparece <strong className="text-red-500">{inhibition.STOP_STIMULUS}</strong></span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <button
        onClick={handleTap}
        className={`flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 transition-colors ${bg}`}
      >
        {showStop ? (
          <span className="text-8xl font-bold text-red-500">{inhibition.STOP_STIMULUS}</span>
        ) : showStimulus ? (
          <span className="text-8xl font-bold text-green-500">{inhibition.GO_STIMULUS}</span>
        ) : (
          <span className="text-4xl text-gray-300">+</span>
        )}
      </button>
    </div>
  );
}
