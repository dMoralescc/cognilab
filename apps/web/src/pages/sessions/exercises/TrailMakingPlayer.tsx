import { useState, useEffect, useRef } from 'react';
import { trailMaking } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  elapsedMs: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function TrailMakingPlayer({ level, seed, elapsedMs, onComplete }: Props) {
  const [{ stimuli }] = useState(() => trailMaking.generate(level, seed));
  const [connected, setConnected] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [wrongId, setWrongId] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!done) return;
    const duration = Date.now() - startRef.current;
    const summary = trailMaking.summarize(stimuli, connected, duration);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (nodeId: number) => {
    if (done) return;
    if (nodeId === connected.length) {
      const next = [...connected, nodeId];
      setConnected(next);
      if (next.length >= stimuli.nodes.length) setDone(true);
    } else {
      setErrors((e) => e + 1);
      setWrongId(nodeId);
      setTimeout(() => setWrongId(null), 500);
    }
  };

  const nextLabel = stimuli.nodes[connected.length]?.label ?? '';

  return (
    <div className="select-none space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">
          {stimuli.version === 'A' ? 'Conecta los números en orden (1→2→3…)' : 'Alterna números y letras (1→A→2→B…)'}
        </span>
        <span className="font-mono text-xs text-gray-400">{connected.length} / {stimuli.nodes.length}</span>
      </div>

      {errors > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5">
          <span className="text-red-500">⚠</span>
          <span className="text-xs font-medium text-red-600">{errors} error{errors !== 1 ? 'es' : ''}</span>
        </div>
      )}

      {/* Canvas */}
      <div className="relative h-80 w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-slate-50 to-gray-100">
        {/* SVG lines */}
        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          {connected.slice(0, -1).map((nodeId, i) => {
            const from = stimuli.nodes[nodeId]!;
            const toId = connected[i + 1];
            if (toId === undefined) return null;
            const to = stimuli.nodes[toId]!;
            return (
              <line
                key={i}
                x1={`${from.x * 100}%`} y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`}  y2={`${to.y * 100}%`}
                stroke="url(#trailGradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {stimuli.nodes.map((node) => {
          const isConnected = connected.includes(node.id);
          const isNext = node.id === connected.length;
          const isWrong = node.id === wrongId;
          return (
            <button
              key={node.id}
              onClick={() => tap(node.id)}
              className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-all active:scale-90 ${
                isWrong
                  ? 'border-red-500 bg-red-100 text-red-600 scale-110'
                  : isConnected
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200 shadow-md'
                  : isNext
                  ? 'border-indigo-400 bg-white text-indigo-600 animate-glow-pulse shadow-md'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:shadow'
              }`}
              style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
            >
              {node.label}
            </button>
          );
        })}
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {done ? '¡Completado!' : <>Siguiente: <span className="font-bold text-indigo-600">{nextLabel}</span></>}
        </p>
        {done && (
          <button
            onClick={() => {
              const duration = Date.now() - startRef.current;
              const summary = trailMaking.summarize(stimuli, connected, duration);
              onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
            }}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95"
          >
            Finalizar
          </button>
        )}
      </div>
    </div>
  );
}
