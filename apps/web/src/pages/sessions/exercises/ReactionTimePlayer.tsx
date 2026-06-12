import { useState, useEffect, useRef, useCallback } from 'react';
import { reactionTime } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'isi' | 'stimulus' | 'done';

export function ReactionTimePlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => reactionTime.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [responses, setResponses] = useState<reactionTime.ReactionTimeResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (responded: boolean, chosenIndex: number | null, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, responded, chosenIndex, reactionTimeMs: rt }]);
      const correct = responded && (currentTrial.choiceIndex === null || chosenIndex === currentTrial.choiceIndex) && rt >= 100;
      setFeedback(correct ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 300);
      if (trialIdx + 1 >= total) { setPhase('done'); }
      else { setTrialIdx((i) => i + 1); setPhase('isi'); }
    },
    [currentTrial, trialIdx, total],
  );

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
        if (!respondedRef.current) finishTrial(false, null, 0);
      }, stimuli.stimulusDurationMs);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [phase, currentTrial, stimuli.stimulusDurationMs, finishTrial]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = reactionTime.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (chosenIndex: number | null = null) => {
    if (phase !== 'stimulus' || respondedRef.current) return;
    respondedRef.current = true;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, chosenIndex, rt);
  };

  const isChoice = stimuli.choiceCount > 1;
  const options = currentTrial?.options ?? [];
  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span>{isChoice ? 'Pulsa el símbolo correcto' : 'Pulsa al ver el símbolo'}</span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      {isChoice ? (
        <div className={`rounded-2xl border-2 border-gray-200 p-6 ${bg}`}>
          <div className="mb-4 text-center">
            {phase === 'stimulus' && currentTrial ? (
              <span className="text-6xl">{options[currentTrial.choiceIndex ?? 0]}</span>
            ) : (
              <span className="text-4xl text-gray-300">+</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleTap(i)}
                className="h-16 rounded-xl border-2 border-gray-200 bg-white text-3xl hover:bg-gray-100 active:bg-gray-200"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => handleTap(null)}
          className={`flex h-64 w-full items-center justify-center rounded-2xl border-2 border-gray-200 transition-colors ${bg}`}
        >
          {phase === 'stimulus' ? (
            <span className="text-8xl text-indigo-500">●</span>
          ) : (
            <span className="text-4xl text-gray-300">+</span>
          )}
        </button>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        {phase === 'stimulus' ? '¡Responde!' : 'Espera...'}
      </p>
    </div>
  );
}
