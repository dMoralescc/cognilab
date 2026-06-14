import { useState, useEffect, useRef, useCallback } from 'react';
import { reactionTime } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

// SVG shape components — no emojis
function ShapeCircle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <circle cx="24" cy="24" r="20" fill={color} />
    </svg>
  );
}
function ShapeSquare({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <rect x="6" y="6" width="36" height="36" rx="4" fill={color} />
    </svg>
  );
}
function ShapeTriangle({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <polygon points="24,4 44,44 4,44" fill={color} />
    </svg>
  );
}
function ShapeDiamond({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full">
      <polygon points="24,2 46,24 24,46 2,24" fill={color} />
    </svg>
  );
}

const SHAPE_CONFIG: Record<string, {
  Component: React.ComponentType<{ color: string }>;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  '◆': { Component: ShapeDiamond,  color: '#0891b2', bg: 'bg-cyan-50',   border: 'border-cyan-400',   label: 'Diamante' },
  '▲': { Component: ShapeTriangle, color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-400',    label: 'Triángulo' },
  '■': { Component: ShapeSquare,   color: '#2563eb', bg: 'bg-blue-50',   border: 'border-blue-400',   label: 'Cuadrado' },
  '●': { Component: ShapeCircle,   color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-400',  label: 'Círculo' },
};

type Phase = 'isi' | 'stimulus' | 'done';
type Flash = 'correct' | 'error' | null;

export function ReactionTimePlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => reactionTime.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('isi');
  const [responses, setResponses] = useState<reactionTime.ReactionTimeResponse>([]);
  const [flash, setFlash] = useState<Flash>(null);
  const [lastRt, setLastRt] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef(false);

  const currentTrial = stimuli.trials[trialIdx];
  const total = stimuli.trials.length;
  const isChoice = stimuli.choiceCount > 1;

  const finishTrial = useCallback(
    (responded: boolean, chosenIndex: number | null, rt: number) => {
      if (!currentTrial || respondedRef.current) return;
      respondedRef.current = true;

      const correct =
        responded &&
        (currentTrial.choiceIndex === null || chosenIndex === currentTrial.choiceIndex) &&
        rt >= 100;

      setResponses((prev) => [
        ...prev,
        { trialId: currentTrial.id, responded, chosenIndex, reactionTimeMs: rt },
      ]);
      setFlash(correct ? 'correct' : 'error');
      if (correct) setHits((h) => h + 1);
      if (rt > 0) setLastRt(rt);
      setTimeout(() => setFlash(null), 350);

      if (trialIdx + 1 >= total) {
        setPhase('done');
      } else {
        setTrialIdx((i) => i + 1);
        setPhase('isi');
      }
    },
    [currentTrial, trialIdx, total],
  );

  // ISI → stimulus
  useEffect(() => {
    if (phase !== 'isi' || !currentTrial) return;
    respondedRef.current = false;
    const timer = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setPhase('stimulus');
    }, currentTrial.isiMs);
    return () => clearTimeout(timer);
  }, [phase, currentTrial, trialIdx]);

  // stimulus timeout → miss
  useEffect(() => {
    if (phase !== 'stimulus') return;
    const timer = setTimeout(() => {
      if (!respondedRef.current) finishTrial(false, null, 0);
    }, stimuli.stimulusDurationMs);
    return () => clearTimeout(timer);
  }, [phase, stimuli.stimulusDurationMs, finishTrial, trialIdx]);

  // done
  useEffect(() => {
    if (phase !== 'done') return;
    const summary = reactionTime.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = (chosenIndex: number | null = null) => {
    if (phase !== 'stimulus') return;
    const rt = Math.round(performance.now() - stimulusStartRef.current);
    finishTrial(true, chosenIndex, rt);
  };

  const options = currentTrial?.options ?? [];
  const targetOption = isChoice && currentTrial && currentTrial.choiceIndex !== null
    ? options[currentTrial.choiceIndex]
    : null;

  const flashBg =
    flash === 'correct' ? 'bg-green-100 border-green-400' :
    flash === 'error'   ? 'bg-red-100 border-red-400' :
    'bg-white border-gray-200';

  return (
    <div className="select-none space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">✓ {hits}</span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">✗ {trialIdx - hits}</span>
        </div>
        {lastRt && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            ⚡ {lastRt}ms
          </span>
        )}
        <span className="text-xs text-gray-400">{trialIdx + 1} / {total}</span>
      </div>

      {/* Progress */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${(trialIdx / total) * 100}%` }} />
      </div>

      {/* Simple RT — big tap zone */}
      {!isChoice && (
        <button
          onClick={() => handleTap(null)}
          className={`relative flex h-64 w-full flex-col items-center justify-center rounded-3xl border-4 transition-all duration-150 ${flashBg}`}
        >
          {phase === 'stimulus' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-28 w-28 animate-bounce">
                <ShapeCircle color="#16a34a" />
              </div>
              <span className="text-base font-bold text-green-700">¡Pulsa!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-30">
              <div className="h-16 w-16">
                <ShapeCircle color="#9ca3af" />
              </div>
              <span className="text-sm text-gray-400">Espera...</span>
            </div>
          )}
        </button>
      )}

      {/* Choice RT */}
      {isChoice && (
        <div className={`rounded-3xl border-4 p-5 transition-all duration-150 ${flashBg}`}>
          {/* Target display */}
          <div className="mb-5 flex flex-col items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              {phase === 'stimulus' ? 'Toca este' : 'Espera...'}
            </p>
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl border-4 p-4 transition-all ${
              phase === 'stimulus' && targetOption
                ? `${SHAPE_CONFIG[targetOption]?.bg ?? 'bg-gray-100'} ${SHAPE_CONFIG[targetOption]?.border ?? 'border-gray-300'} scale-110 shadow-lg`
                : 'bg-gray-100 border-gray-200 opacity-30'
            }`}>
              {phase === 'stimulus' && targetOption ? (() => {
                const cfg = SHAPE_CONFIG[targetOption];
                if (!cfg) return null;
                return <cfg.Component color={cfg.color} />;
              })() : (
                <div className="h-8 w-8"><ShapeSquare color="#d1d5db" /></div>
              )}
            </div>
          </div>

          {/* Choice buttons */}
          <div className={`grid gap-3 ${
            options.length <= 2 ? 'grid-cols-2' :
            options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          }`}>
            {options.map((opt, i) => {
              const cfg = SHAPE_CONFIG[opt];
              if (!cfg) return null;
              return (
                <button
                  key={i}
                  onClick={() => handleTap(i)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-4 py-4 px-2 transition-all active:scale-95 hover:scale-105 ${cfg.bg} ${cfg.border}`}
                >
                  <div className="h-12 w-12">
                    <cfg.Component color={cfg.color} />
                  </div>
                  <span className="text-xs font-bold text-gray-600">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {isChoice ? '¡Toca la figura que aparece arriba lo más rápido posible!' : '¡Toca el círculo en cuanto aparezca!'}
      </p>
    </div>
  );
}
