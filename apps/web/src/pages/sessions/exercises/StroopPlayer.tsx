import { useState, useEffect, useRef, useCallback } from 'react';
import { stroop } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const INK_CSS: Record<string, string> = {
  rojo:     'text-red-500',
  azul:     'text-blue-500',
  verde:    'text-green-500',
  amarillo: 'text-yellow-400',
};

const BTN_STYLES: Record<string, { bg: string; ring: string }> = {
  rojo:     { bg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',         ring: 'ring-red-300' },
  azul:     { bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',       ring: 'ring-blue-300' },
  verde:    { bg: 'bg-green-500 hover:bg-green-600 active:bg-green-700',     ring: 'ring-green-300' },
  amarillo: { bg: 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600', ring: 'ring-yellow-200' },
};

const COLORS: stroop.StroopColor[] = ['rojo', 'azul', 'verde', 'amarillo'];

export function StroopPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => stroop.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<stroop.StroopResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [wordKey, setWordKey] = useState(0);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];

  useEffect(() => {
    startRef.current = performance.now();
    setWordKey((k) => k + 1);
  }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = stroop.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (response: stroop.StroopColor) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const isCorrect = response === currentTrial.correctResponse;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, response, reactionTimeMs: rt }]);
      setFeedback(isCorrect ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 380);
      if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, done, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;

  const flashClass = feedback === 'correct' ? 'animate-flash-correct' : feedback === 'error' ? 'animate-flash-error' : 'bg-gray-50';
  const isIncongruent = currentTrial.word !== currentTrial.inkColor;

  return (
    <div className="select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">¿De qué color está escrita la palabra?</p>
          {isIncongruent && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">interferencia</span>
          )}
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs text-indigo-600">
          {trialIdx + 1} / {stimuli.trials.length}
        </span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${(trialIdx / stimuli.trials.length) * 100}%` }}
        />
      </div>

      {/* Stimulus */}
      <div className={`flex h-52 items-center justify-center rounded-2xl border-2 border-gray-200 transition-none ${flashClass}`}>
        <span
          key={wordKey}
          className={`animate-pop-in text-6xl font-extrabold tracking-wider drop-shadow-sm ${INK_CSS[currentTrial.inkColor] ?? 'text-gray-800'}`}
        >
          {currentTrial.word.toUpperCase()}
        </span>
      </div>

      {/* Color buttons */}
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map((color) => {
          const s = BTN_STYLES[color]!;
          return (
            <button
              key={color}
              onClick={() => respond(color)}
              className={`h-16 rounded-xl text-lg font-bold capitalize text-white shadow-sm ring-0 transition-all active:scale-95 active:ring-4 ${s.bg} ${s.ring}`}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
}
