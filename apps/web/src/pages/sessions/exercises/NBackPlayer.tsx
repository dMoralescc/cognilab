import { useState, useEffect, useRef, useCallback } from 'react';
import { nBack } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function NBackPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => nBack.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [showStimulus, setShowStimulus] = useState(false);
  const [responses, setResponses] = useState<nBack.NBackResponse>([]);
  const respondedRef = useRef(false);
  const stimulusStartRef = useRef(0);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, reactionTimeMs: rt }]);
      setShowStimulus(false);
      if (trialIdx + 1 >= total) return;
      setTimeout(() => setTrialIdx((i) => i + 1), 200);
    },
    [currentTrial, trialIdx, total],
  );

  useEffect(() => {
    if (!currentTrial) return;
    respondedRef.current = false;
    const isiTimer = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setShowStimulus(true);
      const autoTimer = setTimeout(() => {
        if (!respondedRef.current) finishTrial(false, 0);
      }, currentTrial.durationMs);
      return () => clearTimeout(autoTimer);
    }, currentTrial.isiMs);
    return () => clearTimeout(isiTimer);
  }, [trialIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (trialIdx + 1 < total || responses.length === 0) return;
    const summary = nBack.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [responses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, rt);
  };

  const nLabel = `${stimuli.n}-back`;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>Pulsa si el estímulo es igual al de <strong>{nLabel}</strong> posiciones atrás</span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <button
        onClick={handleTap}
        className="flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 bg-gray-50"
      >
        {showStimulus && currentTrial ? (
          <span className="text-8xl font-bold text-indigo-600">{currentTrial.stimulus}</span>
        ) : (
          <span className="text-3xl text-gray-300">+</span>
        )}
      </button>

      {/* History */}
      {trialIdx > 0 && (
        <div className="mt-3 flex justify-center gap-1">
          {stimuli.trials.slice(Math.max(0, trialIdx - 4), trialIdx).map((t, i) => (
            <div key={i} className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-500">
              {t.stimulus}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
