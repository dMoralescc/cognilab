import { useState, useEffect, useRef, useCallback } from 'react';
import { dividedAttention } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'isi' | 'stimulus' | 'done';

export function DividedAttentionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => dividedAttention.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [responses, setResponses] = useState<dividedAttention.DividedAttentionResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const trialStartRef = useRef<number>(0);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  const finishTrial = useCallback(
    (colorResponse: 'red' | 'blue' | null, parityResponse: 'odd' | 'even' | null, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, colorResponse, parityResponse, reactionTimeMs: rt }]);
      const ok = colorResponse === currentTrial.correctColor && parityResponse === currentTrial.correctParity;
      setFeedback(ok ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 300);
      if (trialIdx + 1 >= total) setPhase('done');
      else { setTrialIdx((i) => i + 1); setPhase('isi'); }
    },
    [currentTrial, trialIdx, total],
  );

  useEffect(() => {
    if (phase === 'isi') {
      const t = setTimeout(() => { trialStartRef.current = performance.now(); setPhase('stimulus'); }, stimuli.isiMs);
      return () => clearTimeout(t);
    }
    if (phase === 'stimulus') {
      const t = setTimeout(() => finishTrial(null, null, 0), stimuli.stimulusDurationMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.isiMs, stimuli.stimulusDurationMs, finishTrial]);

  // Two-button state for current trial
  const [colorChoice, setColorChoice] = useState<'red' | 'blue' | null>(null);
  const [parityChoice, setParityChoice] = useState<'odd' | 'even' | null>(null);

  useEffect(() => { setColorChoice(null); setParityChoice(null); }, [trialIdx]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = dividedAttention.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectColor = (c: 'red' | 'blue') => {
    if (phase !== 'stimulus') return;
    const rt = Math.round(performance.now() - trialStartRef.current);
    const newParity = parityChoice;
    setColorChoice(c);
    if (newParity !== null) finishTrial(c, newParity, rt);
  };

  const selectParity = (p: 'odd' | 'even') => {
    if (phase !== 'stimulus') return;
    const rt = Math.round(performance.now() - trialStartRef.current);
    const newColor = colorChoice;
    setParityChoice(p);
    if (newColor !== null) finishTrial(newColor, p, rt);
  };

  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
        <span>Elige el <strong>color</strong> y si el número es <strong>par o impar</strong></span>
        <span className="font-mono text-gray-400">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <div className={`mb-5 flex h-32 items-center justify-center gap-6 rounded-2xl border-2 border-gray-200 ${bg}`}>
        {phase === 'stimulus' && currentTrial ? (
          <>
            <span className={`text-7xl font-bold ${currentTrial.colorLabel === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
              {currentTrial.colorSymbol}
            </span>
            <span className="text-7xl font-bold text-gray-800">{currentTrial.number}</span>
          </>
        ) : (
          <span className="text-4xl text-gray-300">+</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Color</p>
          <button onClick={() => selectColor('red')}
            className={`w-full rounded-xl py-3 font-semibold transition-colors ${colorChoice === 'red' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
            Rojo
          </button>
          <button onClick={() => selectColor('blue')}
            className={`w-full rounded-xl py-3 font-semibold transition-colors ${colorChoice === 'blue' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
            Azul
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Número</p>
          <button onClick={() => selectParity('even')}
            className={`w-full rounded-xl py-3 font-semibold transition-colors ${parityChoice === 'even' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
            Par
          </button>
          <button onClick={() => selectParity('odd')}
            className={`w-full rounded-xl py-3 font-semibold transition-colors ${parityChoice === 'odd' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
            Impar
          </button>
        </div>
      </div>
    </div>
  );
}
