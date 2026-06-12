import { useState, useEffect, useRef, useCallback } from 'react';
import { dualTask } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'isi' | 'stimulus' | 'done';

export function DualTaskPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => dualTask.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [responses, setResponses] = useState<dualTask.DualTaskResponse>([]);
  const trialStartRef = useRef(0);

  const [colorChoice, setColorChoice] = useState<'red'|'blue'|null>(null);
  const [parityChoice, setParityChoice] = useState<'odd'|'even'|null>(null);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;

  useEffect(() => { setColorChoice(null); setParityChoice(null); }, [trialIdx]);

  const finishTrial = useCallback(
    (color: 'red'|'blue'|null, parity: 'odd'|'even'|null, rt: number) => {
      if (!currentTrial) return;
      setResponses((prev) => [...prev, { trialId: currentTrial.id, colorResponse: color, parityResponse: parity, reactionTimeMs: rt }]);
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
      const t = setTimeout(() => finishTrial(null, null, 0), stimuli.durationMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.isiMs, stimuli.durationMs, finishTrial]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = dualTask.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectColor = (c: 'red'|'blue') => {
    if (phase !== 'stimulus') return;
    const rt = Math.round(performance.now() - trialStartRef.current);
    const p = parityChoice;
    setColorChoice(c);
    if (p !== null) finishTrial(c, p, rt);
  };

  const selectParity = (p: 'odd'|'even') => {
    if (phase !== 'stimulus') return;
    const rt = Math.round(performance.now() - trialStartRef.current);
    const c = colorChoice;
    setParityChoice(p);
    if (c !== null) finishTrial(c, p, rt);
  };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Responde ambas preguntas para cada estímulo</span>
        <span className="font-mono">{trialIdx + 1} / {total}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      <div className="mb-4 flex h-24 items-center justify-center gap-6 rounded-2xl border-2 border-gray-200 bg-gray-50">
        {phase === 'stimulus' && currentTrial ? (
          <>
            <span className={`text-6xl font-bold ${currentTrial.colorStimulus === 'red' ? 'text-red-500' : 'text-blue-500'}`}>■</span>
            <span className="text-6xl font-bold text-gray-800">{currentTrial.number}</span>
          </>
        ) : <span className="text-4xl text-gray-300">+</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-center text-xs font-semibold uppercase text-gray-500">Color</p>
          {(['red','blue'] as const).map((c) => (
            <button key={c} onClick={() => selectColor(c)}
              className={`w-full rounded-xl py-2.5 font-semibold transition-colors ${colorChoice === c ? (c === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white') : (c === 'red' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100')}`}>
              {c === 'red' ? 'Rojo' : 'Azul'}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-center text-xs font-semibold uppercase text-gray-500">Número</p>
          {(['even','odd'] as const).map((p) => (
            <button key={p} onClick={() => selectParity(p)}
              className={`w-full rounded-xl py-2.5 font-semibold transition-colors ${parityChoice === p ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
              {p === 'even' ? 'Par' : 'Impar'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
