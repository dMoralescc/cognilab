import { useState, useEffect, useRef, useCallback } from 'react';
import { auditoryAttention } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function AuditoryAttentionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => auditoryAttention.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<auditoryAttention.AuditoryAttentionResponse>([]);
  const [showWord, setShowWord] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, reactionTimeMs: rt }]);
      const correct = responded === currentTrial.isTarget;
      setFeedback(correct ? 'correct' : 'error');
      setTimeout(() => { setFeedback(null); setShowWord(false); }, 400);
      if (trialIdx + 1 >= total) return;
      setTimeout(() => setTrialIdx((i) => i + 1), 600);
    },
    [currentTrial, trialIdx, total],
  );

  useEffect(() => {
    if (!currentTrial) return;
    respondedRef.current = false;
    stimulusStartRef.current = performance.now();
    setShowWord(true);
    const t = setTimeout(() => {
      if (!respondedRef.current) finishTrial(false, 0);
    }, currentTrial.displayDurationMs);
    return () => clearTimeout(t);
  }, [trialIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (trialIdx + 1 < total || responses.length === 0) return;
    const summary = auditoryAttention.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [responses]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, rt);
  };

  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>Pulsa cuando aparezca: <strong className="text-indigo-600">{stimuli.targetWord}</strong></span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <button
        onClick={handleTap}
        className={`flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 transition-colors ${bg}`}
      >
        {showWord && currentTrial ? (
          <span className={`text-5xl font-bold tracking-widest ${currentTrial.isTarget ? 'text-indigo-600' : 'text-gray-700'}`}>
            {currentTrial.word}
          </span>
        ) : (
          <span className="text-3xl text-gray-200">···</span>
        )}
      </button>

      <p className="mt-2 text-center text-xs text-gray-400">
        Pulsa si es la palabra objetivo
      </p>
    </div>
  );
}
