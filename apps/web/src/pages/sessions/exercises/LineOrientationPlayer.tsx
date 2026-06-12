import { useState, useEffect, useRef, useCallback } from 'react';
import { lineOrientation } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

function Line({ angle, length = 40, color = '#374151' }: { angle: number; length?: number; color?: string }) {
  const rad = (angle * Math.PI) / 180;
  const x2 = Math.round(length * Math.cos(rad));
  const y2 = Math.round(length * Math.sin(rad));
  return (
    <svg width={length * 2 + 4} height={length * 2 + 4} className="inline-block">
      <line
        x1={length + 2} y1={length + 2}
        x2={length + 2 + x2} y2={length + 2 - y2}
        stroke={color} strokeWidth={3} strokeLinecap="round"
      />
    </svg>
  );
}

export function LineOrientationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => lineOrientation.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const [responses, setResponses] = useState<lineOrientation.LineOrientationResponse>([]);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  const needed = currentTrial?.targetAngles.length ?? 1;

  useEffect(() => { startRef.current = performance.now(); setSelected([]); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const s = lineOrientation.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleRef = useCallback(
    (idx: number) => {
      if (!currentTrial || feedback !== null) return;
      const newSel = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx];
      setSelected(newSel);
      if (newSel.length === needed) {
        const rt = Math.round(performance.now() - startRef.current);
        const next = [...responses, { trialId: currentTrial.id, chosenIndices: newSel, reactionTimeMs: rt }];
        setResponses(next);
        const correct = currentTrial.correctIndices.slice().sort();
        const chosen = newSel.slice().sort();
        const isCorrect = correct.every((v, i) => v === chosen[i]);
        setFeedback(isCorrect ? 'correct' : 'error');
        setTimeout(() => {
          setFeedback(null);
          if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
          else setTrialIdx((i) => i + 1);
        }, 600);
      }
    },
    [currentTrial, selected, needed, feedback, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;
  const panelBg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>Selecciona {needed === 1 ? 'la línea de referencia' : `las ${needed} líneas`} con la misma orientación</span>
        <span className="font-mono">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      {/* Target lines */}
      <div className={`mb-4 flex items-center justify-center gap-6 rounded-2xl border-2 p-4 ${panelBg}`}>
        {currentTrial.targetAngles.map((angle, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Line angle={angle} color="#4f46e5" length={35} />
            <span className="text-xs text-gray-400">Modelo {i + 1}</span>
          </div>
        ))}
      </div>

      {/* Reference fan */}
      <div className="grid grid-cols-5 gap-2">
        {currentTrial.referenceAngles.map((angle, idx) => (
          <button
            key={idx}
            onClick={() => toggleRef(idx)}
            disabled={feedback !== null}
            className={`flex h-16 items-center justify-center rounded-xl border-2 ${
              selected.includes(idx) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            } disabled:opacity-60`}
          >
            <Line angle={angle} length={20} color={selected.includes(idx) ? '#4f46e5' : '#374151'} />
          </button>
        ))}
      </div>
    </div>
  );
}
