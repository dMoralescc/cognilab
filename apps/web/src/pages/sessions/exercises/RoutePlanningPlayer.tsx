import { useState, useEffect } from 'react';
import { routePlanning } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function RoutePlanningPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => routePlanning.generate(level, seed));
  const [route, setRoute] = useState<number[]>([stimuli.startId]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const summary = routePlanning.summarize(stimuli, route);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPoint = (id: number) => {
    if (done || route.includes(id)) return;
    const next = [...route, id];
    setRoute(next);
  };

  const confirm = () => setDone(true);
  const reset = () => setRoute([stimuli.startId]);

  const notVisited = stimuli.points.filter((p) => !route.includes(p.id));

  return (
    <div className="select-none">
      <p className="mb-2 text-sm text-gray-600 text-center">
        Planifica una ruta que visite todos los puntos
        {stimuli.constraints.length > 0 && (
          <span className="ml-1 text-xs text-amber-600">
            (restricciones: {stimuli.constraints.map((c) => {
              const b = stimuli.points[c.before]?.label;
              const a = stimuli.points[c.after]?.label;
              return `${b} antes que ${a}`;
            }).join(', ')})
          </span>
        )}
      </p>

      {/* Map */}
      <div className="relative mb-4 h-56 w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-gray-50">
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {route.slice(0, -1).map((id, i) => {
            const from = stimuli.points[id]!, to = stimuli.points[route[i + 1]!]!;
            return <line key={i} x1={`${from.x * 100}%`} y1={`${from.y * 100}%`} x2={`${to.x * 100}%`} y2={`${to.y * 100}%`} stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />;
          })}
        </svg>
        {stimuli.points.map((p) => {
          const inRoute = route.indexOf(p.id);
          const isStart = p.id === stimuli.startId;
          return (
            <button
              key={p.id}
              onClick={() => addPoint(p.id)}
              className={`absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                isStart ? 'border-green-500 bg-green-100 text-green-700' :
                inRoute !== -1 ? 'border-indigo-500 bg-indigo-100 text-indigo-700' :
                'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
            >
              {inRoute !== -1 ? inRoute : p.label.slice(0, 2)}
            </button>
          );
        })}
      </div>

      {/* Route display */}
      <div className="mb-3 flex flex-wrap gap-1 text-sm">
        {route.map((id, i) => (
          <span key={i} className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700 font-medium">
            {stimuli.points[id]?.label}{i < route.length - 1 ? ' →' : ''}
          </span>
        ))}
        {notVisited.length > 0 && <span className="text-xs text-gray-400">({notVisited.length} pendientes)</span>}
      </div>

      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 rounded-lg border-2 border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50">Reiniciar</button>
        <button
          onClick={confirm}
          disabled={notVisited.length > 0}
          className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Confirmar ruta
        </button>
      </div>
    </div>
  );
}
