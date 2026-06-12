import { useState, useEffect, useCallback } from 'react';
import { alternatingAttention } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function AlternatingAttentionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => alternatingAttention.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<alternatingAttention.AlternatingAttentionResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [trialStart, setTrialStart] = useState(() => performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];

  useEffect(() => {
    setTrialStart(performance.now());
  }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = alternatingAttention.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (response: string) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - trialStart);
      const newResp = { trialId: currentTrial.id, response, reactionTimeMs: rt };
      const newResponses = [...responses, newResp];
      setResponses(newResponses);
      setFeedback(response === currentTrial.correctResponse ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 300);
      if (trialIdx + 1 >= stimuli.trials.length) {
        setDone(true);
      } else {
        setTrialIdx((i) => i + 1);
      }
    },
    [currentTrial, done, trialIdx, responses, stimuli.trials.length, trialStart],
  );

  if (!currentTrial) return null;

  const isRuleA = currentTrial.rule === 'A';
  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-white';

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          {isRuleA ? stimuli.ruleA : stimuli.ruleB}
        </span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / stimuli.trials.length) * 100}%` }} />
      </div>

      <div className={`mb-6 flex h-32 items-center justify-center rounded-2xl border-2 border-gray-200 ${bg}`}>
        <span className="text-7xl font-bold text-gray-800">{currentTrial.stimulus}</span>
      </div>

      {isRuleA ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => respond('even')} className="h-16 rounded-xl bg-indigo-50 text-lg font-semibold text-indigo-700 hover:bg-indigo-100">Par</button>
          <button onClick={() => respond('odd')}  className="h-16 rounded-xl bg-indigo-50 text-lg font-semibold text-indigo-700 hover:bg-indigo-100">Impar</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => respond('greater')} className="h-16 rounded-xl bg-purple-50 text-lg font-semibold text-purple-700 hover:bg-purple-100">Mayor que 5</button>
          <button onClick={() => respond('less')}    className="h-16 rounded-xl bg-purple-50 text-lg font-semibold text-purple-700 hover:bg-purple-100">Menor que 5</button>
        </div>
      )}
    </div>
  );
}
