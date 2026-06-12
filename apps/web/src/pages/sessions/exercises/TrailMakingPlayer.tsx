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
  const [connected, setConnected] = useState<number[]>([]);  // node ids connected so far
  const [errors, setErrors] = useState(0);
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
    const expected = connected.length; // next expected node index
    if (nodeId === expected) {
      const next = [...connected, nodeId];
      setConnected(next);
      if (next.length >= stimuli.nodes.length) setDone(true);
    } else {
      setErrors((e) => e + 1);
    }
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>
          {stimuli.version === 'A' ? 'Conecta los números en orden' : 'Alterna: 1→A→2→B→3...'}
        </span>
        <span className="font-mono text-gray-400">{connected.length} / {stimuli.nodes.length}</span>
      </div>
      {errors > 0 && <p className="mb-2 text-center text-sm text-red-500">{errors} error{errors !== 1 ? 'es' : ''}</p>}

      <div className="relative mx-auto h-72 w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50">
        {/* SVG lines */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {connected.slice(0, -1).map((nodeId, i) => {
            const from = stimuli.nodes[nodeId]!;
            const toId = connected[i + 1];
            if (toId === undefined) return null;
            const to = stimuli.nodes[toId]!;
            return (
              <line
                key={i}
                x1={`${from.x * 100}%`} y1={`${from.y * 100}%`}
                x2={`${to.x * 100}%`} y2={`${to.y * 100}%`}
                stroke="#6366f1" strokeWidth="2"
              />
            );
          })}
        </svg>

        {stimuli.nodes.map((node) => {
          const isConnected = connected.includes(node.id);
          const isNext = node.id === connected.length;
          return (
            <button
              key={node.id}
              onClick={() => tap(node.id)}
              className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                isConnected ? 'border-indigo-600 bg-indigo-600 text-white' :
                isNext ? 'border-indigo-400 bg-white text-indigo-600 ring-2 ring-indigo-200' :
                'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
            >
              {node.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        {done ? '¡Completado!' : `Siguiente: ${stimuli.nodes[connected.length]?.label ?? ''}`}
      </p>
      {done && (
        <button
          onClick={() => {
            const duration = Date.now() - startRef.current;
            const summary = trailMaking.summarize(stimuli, connected, duration);
            onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
          }}
          className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Finalizar
        </button>
      )}
    </div>
  );
}
