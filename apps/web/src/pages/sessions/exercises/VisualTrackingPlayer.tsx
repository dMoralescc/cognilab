import { useState, useEffect, useRef, useCallback } from 'react';
import { visualTracking } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'preview' | 'tracking' | 'select' | 'done';

interface ObjPos { id: number; x: number; y: number; isTarget: boolean }

export function VisualTrackingPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => visualTracking.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('preview');
  const [positions, setPositions] = useState<ObjPos[]>(() =>
    stimuli.objects.map((o) => ({ id: o.id, x: o.x, y: o.y, isTarget: o.isTarget })),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>(0);
  const lastTimeRef = useRef<number>(0);

  // Preview: show targets highlighted for 2s, then hide identity and start movement
  useEffect(() => {
    const timer = setTimeout(() => setPhase('tracking'), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Stop tracking after durationMs
  useEffect(() => {
    if (phase !== 'tracking') return;
    const timer = setTimeout(() => { cancelAnimationFrame(animRef.current); setPhase('select'); }, stimuli.durationMs);
    return () => clearTimeout(timer);
  }, [phase, stimuli.durationMs]);

  // Animation loop
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current === 0) { lastTimeRef.current = time; }
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      setPositions((prev) =>
        prev.map((obj, i) => {
          const src = stimuli.objects[i]!;
          let nx = obj.x + src.vx * stimuli.speedMultiplier * dt;
          let ny = obj.y + src.vy * stimuli.speedMultiplier * dt;
          if (nx < 0.05 || nx > 0.95) { stimuli.objects[i]!.vx *= -1; nx = Math.max(0.05, Math.min(0.95, nx)); }
          if (ny < 0.05 || ny > 0.95) { stimuli.objects[i]!.vy *= -1; ny = Math.max(0.05, Math.min(0.95, ny)); }
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
  }, [phase, animate]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = visualTracking.summarize(stimuli, selected);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id: number) => {
    if (phase !== 'select') return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const confirm = () => setPhase('done');

  const showTarget = phase === 'preview' || phase === 'select';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>
          {phase === 'preview' && `Memoriza los ${stimuli.targetCount} objeto(s) resaltados`}
          {phase === 'tracking' && 'Sigue los objetos con la vista'}
          {phase === 'select' && `Selecciona los ${stimuli.targetCount} objetos que seguiste`}
        </span>
      </div>

      <div className="relative mx-auto h-72 w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50">
        {positions.map((obj) => {
          const isSelected = selected.includes(obj.id);
          let dotClass = 'bg-gray-600';
          if (phase === 'preview' && obj.isTarget) dotClass = 'bg-indigo-500 ring-2 ring-indigo-300';
          if (phase === 'select') dotClass = isSelected ? 'bg-indigo-500 ring-2 ring-indigo-300' : 'bg-gray-600 hover:bg-gray-500';
          return (
            <button
              key={obj.id}
              onClick={() => toggleSelect(obj.id)}
              className={`absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors ${dotClass}`}
              style={{ left: `${obj.x * 100}%`, top: `${obj.y * 100}%` }}
            />
          );
        })}
      </div>

      {phase === 'select' && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={confirm}
            disabled={selected.length === 0}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Confirmar ({selected.length} / {stimuli.targetCount})
          </button>
        </div>
      )}
    </div>
  );
}
