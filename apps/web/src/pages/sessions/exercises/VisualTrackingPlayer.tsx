import { useState, useEffect, useRef, useCallback } from 'react';
import { visualTracking } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'preview' | 'tracking' | 'select' | 'feedback';

interface ObjPos { id: number; x: number; y: number; isTarget: boolean }

const TOTAL_ROUNDS = 5;

export function VisualTrackingPlayer({ level, seed, onComplete }: Props) {
  const [round, setRound] = useState(0);
  const [content, setContent] = useState(() => visualTracking.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('preview');
  const [positions, setPositions] = useState<ObjPos[]>(() =>
    content.stimuli.objects.map((o) => ({ id: o.id, x: o.x, y: o.y, isTarget: o.isTarget })),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [lastResult, setLastResult] = useState<{ hits: number; targets: number } | null>(null);
  const [countdown, setCountdown] = useState(2);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0);
  const lastTimeRef = useRef<number>(0);

  const { stimuli } = content;

  // Countdown during preview
  useEffect(() => {
    if (phase !== 'preview') return;
    setCountdown(2);
    const iv = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timer = setTimeout(() => { clearInterval(iv); setPhase('tracking'); }, 2000);
    return () => { clearTimeout(timer); clearInterval(iv); };
  }, [phase, round]);

  // Stop tracking after durationMs
  useEffect(() => {
    if (phase !== 'tracking') return;
    const timer = setTimeout(() => {
      cancelAnimationFrame(animRef.current);
      setPhase('select');
    }, stimuli.durationMs);
    return () => clearTimeout(timer);
  }, [phase, stimuli.durationMs, round]);

  // Animation loop
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      setPositions((prev) =>
        prev.map((obj, i) => {
          const src = stimuli.objects[i]!;
          let nx = obj.x + src.vx * stimuli.speedMultiplier * dt;
          let ny = obj.y + src.vy * stimuli.speedMultiplier * dt;
          if (nx < 0.05 || nx > 0.95) { src.vx *= -1; nx = Math.max(0.05, Math.min(0.95, nx)); }
          if (ny < 0.05 || ny > 0.95) { src.vy *= -1; ny = Math.max(0.05, Math.min(0.95, ny)); }
          return { ...obj, x: nx, y: ny };
        }),
      );
      animRef.current = requestAnimationFrame(animate);
    },
    [stimuli],
  );

  useEffect(() => {
    if (phase !== 'tracking') return;
    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, animate, round]);

  const toggleSelect = (id: number) => {
    if (phase !== 'select') return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const confirm = () => {
    const summary = visualTracking.summarize(stimuli, selected);
    setLastResult({ hits: summary.hits, targets: stimuli.targetCount });
    setTotalHits((h) => h + summary.hits);
    setTotalErrors((e) => e + summary.errors);
    setPhase('feedback');
  };

  const nextRound = () => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS) {
      onComplete({
        hits: totalHits,
        errors: totalErrors,
        reactionTimeMs: null,
        rawData: { rounds: TOTAL_ROUNDS },
      });
      return;
    }
    const newContent = visualTracking.generate(level, seed + next * 1000);
    setRound(next);
    setContent(newContent);
    setPositions(newContent.stimuli.objects.map((o) => ({ id: o.id, x: o.x, y: o.y, isTarget: o.isTarget })));
    setSelected([]);
    setLastResult(null);
    setPhase('preview');
  };

  const perfect = lastResult?.hits === lastResult?.targets;

  return (
    <div className="select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          {phase === 'preview' && <span>Memoriza los <span className="text-indigo-600">{stimuli.targetCount}</span> objetos azules</span>}
          {phase === 'tracking' && <span className="text-amber-600 font-bold">¡Síguelos con la vista!</span>}
          {phase === 'select' && <span>Toca los <span className="text-indigo-600">{stimuli.targetCount}</span> que seguiste</span>}
          {phase === 'feedback' && <span className={perfect ? 'text-green-600' : 'text-red-600'}>{perfect ? '¡Perfecto!' : `${lastResult?.hits} de ${lastResult?.targets} correctos`}</span>}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
            <div key={i} className={`h-2.5 w-2.5 rounded-full transition-all ${i < round ? 'bg-green-400' : i === round ? 'bg-indigo-500 scale-125' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {/* Arena */}
      <div className={`relative mx-auto overflow-hidden rounded-2xl border-4 transition-colors duration-300 ${
        phase === 'tracking' ? 'border-amber-300 bg-amber-50' :
        phase === 'feedback' ? (perfect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') :
        'border-indigo-200 bg-slate-50'
      }`} style={{ width: '100%', paddingBottom: '65%' }}>

        {/* Countdown overlay */}
        {phase === 'preview' && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none z-10">
            <span className="rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">
              Memoriza… {countdown}s
            </span>
          </div>
        )}

        {positions.map((obj) => {
          const isSelected = selected.includes(obj.id);
          const isCorrect = phase === 'feedback' && obj.isTarget && isSelected;
          const isMissed  = phase === 'feedback' && obj.isTarget && !isSelected;
          const isWrong   = phase === 'feedback' && !obj.isTarget && isSelected;

          let dotClass = '';
          if (phase === 'preview') {
            dotClass = obj.isTarget
              ? 'bg-indigo-500 ring-4 ring-indigo-300 scale-125 shadow-lg shadow-indigo-300'
              : 'bg-gray-400';
          } else if (phase === 'tracking') {
            dotClass = 'bg-amber-500 shadow-md';
          } else if (phase === 'select') {
            dotClass = isSelected
              ? 'bg-indigo-500 ring-4 ring-indigo-300 scale-125'
              : 'bg-gray-500 hover:bg-gray-400 hover:scale-110';
          } else {
            // feedback
            dotClass = isCorrect ? 'bg-green-500 ring-4 ring-green-300 scale-125'
              : isMissed  ? 'bg-red-400 ring-4 ring-red-200 animate-pulse'
              : isWrong   ? 'bg-orange-400 ring-4 ring-orange-200'
              : 'bg-gray-300 opacity-40';
          }

          return (
            <button
              key={obj.id}
              onClick={() => toggleSelect(obj.id)}
              disabled={phase !== 'select'}
              className={`absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${dotClass}`}
              style={{ left: `${obj.x * 100}%`, top: `${obj.y * 100}%` }}
            />
          );
        })}
      </div>

      {/* Footer */}
      {phase === 'select' && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {selected.length} seleccionado{selected.length !== 1 ? 's' : ''} de {stimuli.targetCount}
          </p>
          <button
            onClick={confirm}
            disabled={selected.length === 0}
            className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-40"
          >
            Confirmar ✓
          </button>
        </div>
      )}

      {phase === 'feedback' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{perfect ? '✅' : '❌'}</span>
            <span className="text-xs text-gray-500">
              Verde = correcto · Rojo = perdido · Naranja = error
            </span>
          </div>
          <button
            onClick={nextRound}
            className="rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95"
          >
            {round + 1 >= TOTAL_ROUNDS ? 'Ver resultado' : 'Siguiente →'}
          </button>
        </div>
      )}
    </div>
  );
}
