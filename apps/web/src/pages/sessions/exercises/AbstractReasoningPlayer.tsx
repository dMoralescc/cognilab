import { useState, useEffect, useRef, useCallback } from 'react';
import { abstractReasoning } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const SHAPE_SYMBOLS: Record<string, string> = { circle: '●', square: '■', triangle: '▲' };
const FILL_OPACITY: Record<string, string> = { empty: 'opacity-20', half: 'opacity-60', full: 'opacity-100' };
const SIZE_CSS: Record<string, string> = { small: 'text-base', medium: 'text-xl', large: 'text-2xl' };

function MatrixCell({ item }: { item: abstractReasoning.MatrixItem | null }) {
  if (!item) return <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-2xl font-bold text-gray-400">?</div>;
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded bg-white text-center ${SIZE_CSS[item.size] ?? ''} font-bold text-indigo-600 ${FILL_OPACITY[item.fill] ?? ''}`}>
      {SHAPE_SYMBOLS[item.shape]}
    </div>
  );
}

export function AbstractReasoningPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => abstractReasoning.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<abstractReasoning.AbstractReasoningResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = abstractReasoning.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { trialId: currentTrial.id, chosenIndex, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosenIndex === currentTrial.correctIndex ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 250);
      if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, done, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>¿Qué elemento completa la matriz?</span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      {/* 3x3 matrix */}
      <div className="mx-auto mb-5 grid w-fit grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-3">
        {currentTrial.matrix.map((cell, i) => <MatrixCell key={i} item={cell} />)}
      </div>

      {/* Options */}
      <div className="grid grid-cols-4 gap-2">
        {currentTrial.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            className="flex h-14 items-center justify-center rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50"
          >
            <MatrixCell item={opt} />
          </button>
        ))}
      </div>
    </div>
  );
}
