import { useState, useEffect, useRef, useCallback } from 'react';
import { stroop } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const COLOR_CSS: Record<string, string> = {
  rojo: 'text-red-500', azul: 'text-blue-500', verde: 'text-green-500', amarillo: 'text-yellow-500',
};
const BUTTONS: stroop.StroopColor[] = ['rojo', 'azul', 'verde', 'amarillo'];
const BTN_BG: Record<string, string> = {
  rojo: 'bg-red-50 hover:bg-red-100 text-red-700',
  azul: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
  verde: 'bg-green-50 hover:bg-green-100 text-green-700',
  amarillo: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700',
};

export function StroopPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => stroop.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<stroop.StroopResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];

  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = stroop.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (response: stroop.StroopColor) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { trialId: currentTrial.id, response, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(response === currentTrial.correctResponse ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 200);
      if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, done, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;
  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>¿De qué color está escrita la palabra?</span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / stimuli.trials.length) * 100}%` }} />
      </div>

      <div className={`mb-6 flex h-32 items-center justify-center rounded-2xl border-2 border-gray-200 ${bg}`}>
        <span className={`text-5xl font-bold ${COLOR_CSS[currentTrial.inkColor] ?? ''}`}>
          {currentTrial.word.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BUTTONS.map((color) => (
          <button
            key={color}
            onClick={() => respond(color)}
            className={`h-14 rounded-xl border-2 border-transparent font-semibold capitalize transition-colors ${BTN_BG[color] ?? ''}`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
