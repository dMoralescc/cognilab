import { useState, useEffect, useRef, useCallback } from 'react';
import { reactionTime } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

// Visual config for each choice option
const CHOICE_CONFIG: Record<string, { emoji: string; bg: string; border: string; label: string }> = {
  '◆': { emoji: '💎', bg: 'bg-cyan-100',    border: 'border-cyan-400',   label: 'Diamante' },
  '▲': { emoji: '🔺', bg: 'bg-red-100',     border: 'border-red-400',    label: 'Triángulo' },
  '■': { emoji: '🟦', bg: 'bg-blue-100',    border: 'border-blue-400',   label: 'Cuadrado' },
  '●': { emoji: '🟢', bg: 'bg-green-100',   border: 'border-green-400',  label: 'Círculo' },
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
    onComplete({
      hits: summary.hits,
      errors: summary.errors,
      reactionTimeMs: summary.reactionTimeMs,
      rawData: summary.rawData,
    });
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
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
            ✓ {hits}
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
            ✗ {trialIdx - hits}
          </span>
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
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${(trialIdx / total) * 100}%` }}
        />
      </div>

      {/* Simple RT */}
      {!isChoice && (
        <button
          onClick={() => handleTap(null)}
          className={`relative flex h-64 w-full flex-col items-center justify-center rounded-3xl border-4 transition-all duration-150 ${flashBg}`}
        >
          {phase === 'stimulus' ? (
            <div className="flex flex-col items-center gap-3 animate-bounce">
              <span className="text-8xl">⭐</span>
              <span className="text-lg font-bold text-amber-600">¡Pulsa!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-40">
              <span className="text-5xl text-gray-400">+</span>
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
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl border-4 transition-all ${
              phase === 'stimulus' && targetOption
                ? `${CHOICE_CONFIG[targetOption]?.bg ?? 'bg-gray-100'} ${CHOICE_CONFIG[targetOption]?.border ?? 'border-gray-300'} scale-110 shadow-lg`
                : 'bg-gray-100 border-gray-200 opacity-30'
            }`}>
              {phase === 'stimulus' && targetOption ? (
                <span className="text-5xl animate-bounce">
                  {CHOICE_CONFIG[targetOption]?.emoji ?? targetOption}
                </span>
              ) : (
                <span className="text-4xl text-gray-300">+</span>
              )}
            </div>
          </div>

          {/* Choice buttons */}
          <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {options.map((opt, i) => {
              const cfg = CHOICE_CONFIG[opt] ?? { emoji: opt, bg: 'bg-gray-100', border: 'border-gray-300', label: opt };
              return (
                <button
                  key={i}
                  onClick={() => handleTap(i)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-4 py-4 transition-all active:scale-95 hover:scale-105 ${cfg.bg} ${cfg.border}`}
                >
                  <span className="text-4xl">{cfg.emoji}</span>
                  <span className="text-xs font-bold text-gray-600">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hint */}
      <p className="text-center text-xs text-gray-400">
        {isChoice
          ? '¡Toca la figura que aparece arriba lo más rápido posible!'
          : '¡Toca la estrella en cuanto aparezca!'}
      </p>
    </div>
  );
}
