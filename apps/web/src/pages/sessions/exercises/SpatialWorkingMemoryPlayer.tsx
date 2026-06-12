import { useState, useEffect } from 'react';
import { spatialWorkingMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'show' | 'updates' | 'recall' | 'done';

const OBJECT_EMOJIS = ['🔑','📚','🎸','⚽','🎨','🎲'];

export function SpatialWorkingMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => spatialWorkingMemory.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('show');
  const [updateIdx, setUpdateIdx] = useState(0);
  const [response, setResponse] = useState<spatialWorkingMemory.SpatialWorkingMemoryResponse>([]);
  const [movingObject, setMovingObject] = useState<spatialWorkingMemory.SpatialUpdate | null>(null);
  const [currentPositions, setCurrentPositions] = useState<Map<number, number>>(
    () => new Map(stimuli.initialObjects.map((o) => [o.id, o.position])),
  );
  const [selectingFor, setSelectingFor] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase(stimuli.updates.length > 0 ? 'updates' : 'recall'), 4000);
      return () => clearTimeout(t);
    }
    if (phase === 'updates') {
      if (updateIdx >= stimuli.updates.length) { setPhase('recall'); return; }
      const update = stimuli.updates[updateIdx]!;
      setMovingObject(update);
      const t = setTimeout(() => {
        setCurrentPositions((prev) => {
          const next = new Map(prev);
          next.set(update.objectId, update.newPosition);
          return next;
        });
        setMovingObject(null);
        setUpdateIdx((i) => i + 1);
      }, 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, updateIdx, stimuli.updates]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = spatialWorkingMemory.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectCell = (cellIdx: number) => {
    if (phase !== 'recall' || selectingFor === null) return;
    const next = [...response.filter((r) => r.objectId !== selectingFor), { objectId: selectingFor, position: cellIdx }];
    setResponse(next);
    setConfirmed((prev) => new Set([...prev, selectingFor]));
    setSelectingFor(null);
    if (next.length >= stimuli.initialObjects.length) setPhase('done');
  };

  const cols = stimuli.gridSize;
  const total = cols * cols;
  const posToObj = new Map(stimuli.initialObjects.map((o) => [o.position, o.id]));

  return (
    <div className="select-none">
      <p className="mb-3 text-center text-sm text-gray-600">
        {phase === 'show' && 'Memoriza la posición de cada objeto'}
        {phase === 'updates' && (movingObject ? `El objeto se mueve... (${updateIdx + 1}/${stimuli.updates.length})` : 'Actualizando...')}
        {phase === 'recall' && (selectingFor !== null ? `¿Dónde quedó ${OBJECT_EMOJIS[selectingFor]}? Toca la casilla` : 'Selecciona un objeto para indicar su posición final')}
      </p>

      <div
        className="mx-auto grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 72}px` }}
      >
        {Array.from({ length: total }, (_, cellIdx) => {
          const objId = phase === 'show' ? posToObj.get(cellIdx) : undefined;
          const respPos = response.find((r) => r.position === cellIdx);
          return (
            <button
              key={cellIdx}
              onClick={() => selectCell(cellIdx)}
              className={`flex h-16 w-full items-center justify-center rounded-lg border-2 text-2xl transition-colors ${
                selectingFor !== null ? 'border-indigo-300 hover:bg-indigo-50' :
                objId !== undefined ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white'
              } ${respPos ? 'border-green-400 bg-green-50' : ''}`}
            >
              {phase === 'show' && objId !== undefined ? OBJECT_EMOJIS[objId] ?? '' :
               respPos ? OBJECT_EMOJIS[respPos.objectId] ?? '' : ''}
            </button>
          );
        })}
      </div>

      {/* Object selector for recall phase */}
      {phase === 'recall' && (
        <div className="mt-4 flex justify-center gap-2">
          {stimuli.initialObjects.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectingFor(confirmed.has(o.id) ? null : o.id)}
              className={`h-12 w-12 rounded-xl border-2 text-2xl ${
                confirmed.has(o.id) ? 'border-green-400 bg-green-50 opacity-50' :
                selectingFor === o.id ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              {OBJECT_EMOJIS[o.id] ?? ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
