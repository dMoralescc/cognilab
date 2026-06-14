import { useState, useEffect, useRef, useCallback } from 'react';
import { towerOfHanoi } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

// Color per disk size (1=smallest → 6=largest)
const DISK_COLORS = [
  { bg: '#f43f5e', shadow: '#fda4af' }, // rose
  { bg: '#f97316', shadow: '#fdba74' }, // orange
  { bg: '#eab308', shadow: '#fde047' }, // yellow
  { bg: '#22c55e', shadow: '#86efac' }, // green
  { bg: '#3b82f6', shadow: '#93c5fd' }, // blue
  { bg: '#8b5cf6', shadow: '#c4b5fd' }, // violet
];

const PEG_LABELS = ['A', 'B', 'C'];
const GOAL_LABEL = ['izquierdo', 'central', 'derecho'];

export function TowerOfHanoiPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => towerOfHanoi.generate(level, seed));
  const [pegs, setPegs] = useState<number[][]>(() => stimuli.initialState.pegs.map((p) => [...p]));
  const [moves, setMoves] = useState<Array<[number, number]>>([]);
  const [illegalCount, setIllegalCount] = useState(0);
  const [done, setDone] = useState(false);
  const [illegalFlash, setIllegalFlash] = useState(false);

  // Drag state
  const [dragging, setDragging] = useState<{ pegIdx: number; disk: number } | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOver, setDragOver] = useState<number | null>(null);
  const pegRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!done) return;
    const summary = towerOfHanoi.summarize(stimuli, moves);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDragOver = useCallback((x: number, y: number): number | null => {
    for (let i = 0; i < 3; i++) {
      const rect = pegRefs.current[i]?.getBoundingClientRect();
      if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return i;
      }
    }
    return null;
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, pegIdx: number) => {
    if (done) return;
    const topDisk = pegs[pegIdx]?.[pegs[pegIdx]!.length - 1];
    if (topDisk === undefined) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({ pegIdx, disk: topDisk });
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragOver(pegIdx);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragOver(getDragOver(e.clientX, e.clientY));
  }, [dragging, getDragOver]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const target = getDragOver(e.clientX, e.clientY);

    if (target !== null && target !== dragging.pegIdx) {
      const fromPeg = pegs[dragging.pegIdx]!;
      const toPeg = pegs[target]!;
      const disk = fromPeg[fromPeg.length - 1];
      const topTo = toPeg[toPeg.length - 1];

      if (disk !== undefined && (topTo === undefined || disk < topTo)) {
        const newPegs = pegs.map((p) => [...p]);
        newPegs[dragging.pegIdx]!.pop();
        newPegs[target]!.push(disk);
        const newMoves: Array<[number, number]> = [...moves, [dragging.pegIdx, target]];
        setPegs(newPegs);
        setMoves(newMoves);
        const goalPeg = newPegs[stimuli.goalPeg] ?? [];
        if (goalPeg.length === stimuli.diskCount) setDone(true);
      } else {
        setIllegalCount((c) => c + 1);
        setIllegalFlash(true);
        setTimeout(() => setIllegalFlash(false), 500);
      }
    }

    setDragging(null);
    setDragOver(null);
  }, [dragging, pegs, moves, stimuli, getDragOver]);

  const diskWidth = (disk: number, maxDisk: number) => {
    const minPct = 22;
    const maxPct = 82;
    return minPct + ((disk - 1) / Math.max(maxDisk - 1, 1)) * (maxPct - minPct);
  };

  const maxDisk = stimuli.diskCount;
  const minMoves = stimuli.minMoves;
  const extraMoves = moves.length > minMoves ? moves.length - minMoves : 0;

  return (
    <div className="select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">
          Mueve todos los discos al poste <strong>{GOAL_LABEL[stimuli.goalPeg]}</strong>
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-mono">
            {moves.length} mov · mín. {minMoves}
            {extraMoves > 0 && <span className="text-amber-600"> (+{extraMoves})</span>}
          </span>
          {illegalCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-600 font-medium">
              {illegalCount} inválido{illegalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Towers */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl border-2 p-4 pb-0 transition-colors ${
          illegalFlash ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gradient-to-b from-slate-50 to-gray-100'
        }`}
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex justify-around gap-1">
          {pegs.map((peg, pegIdx) => {
            const isOver = dragOver === pegIdx && dragging !== null && dragging.pegIdx !== pegIdx;
            const isSource = dragging?.pegIdx === pegIdx;
            const topDisk = peg[peg.length - 1];
            const canDrag = topDisk !== undefined && !done;

            return (
              <div
                key={pegIdx}
                ref={(el) => { pegRefs.current[pegIdx] = el; }}
                className={`relative flex flex-1 flex-col items-center transition-all ${
                  isOver ? 'opacity-100' : ''
                }`}
              >
                {/* Peg label */}
                <span className={`mb-1 text-xs font-bold transition-colors ${
                  isOver ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {PEG_LABELS[pegIdx]}
                  {pegIdx === stimuli.goalPeg && (
                    <span className="ml-1 text-indigo-500">🎯</span>
                  )}
                </span>

                {/* Tower body */}
                <div
                  className={`relative flex h-52 w-full flex-col-reverse items-center justify-start rounded-xl border-2 transition-all pt-2 ${
                    isOver
                      ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100'
                      : isSource
                      ? 'border-gray-300 bg-white opacity-80'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Pole */}
                  <div className="pointer-events-none absolute inset-x-1/2 top-3 bottom-6 w-2 -translate-x-1/2 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 shadow-sm" />

                  {/* Disks */}
                  {peg.map((disk, di) => {
                    const isTop = di === peg.length - 1;
                    const color = DISK_COLORS[(disk - 1) % DISK_COLORS.length]!;
                    const wPct = diskWidth(disk, maxDisk);
                    const isDraggedDisk = isTop && isSource && dragging !== null;

                    return (
                      <div
                        key={disk}
                        onPointerDown={isTop && canDrag ? (e) => handlePointerDown(e, pegIdx) : undefined}
                        className={`z-10 mb-1 flex h-7 cursor-grab items-center justify-center rounded-full text-xs font-bold text-white shadow-md transition-all active:cursor-grabbing ${
                          isTop && canDrag ? 'hover:brightness-110 hover:scale-105' : ''
                        } ${isDraggedDisk ? 'opacity-30 scale-95' : ''}`}
                        style={{
                          width: `${wPct}%`,
                          background: `linear-gradient(135deg, ${color.bg}, ${color.shadow})`,
                          boxShadow: `0 3px 8px ${color.shadow}99`,
                        }}
                      >
                        {disk}
                      </div>
                    );
                  })}

                  {/* Drop indicator */}
                  {isOver && (
                    <div
                      className="z-10 mb-1 h-7 rounded-full border-2 border-dashed border-indigo-400 bg-indigo-50 opacity-60 animate-pulse"
                      style={{ width: `${diskWidth(dragging!.disk, maxDisk)}%` }}
                    />
                  )}
                </div>

                {/* Base */}
                <div className="h-3 w-full rounded-b-lg bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 shadow-sm" />
              </div>
            );
          })}
        </div>

        {/* Floating dragged disk */}
        {dragging && (
          <div
            className="pointer-events-none fixed z-50 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-2xl"
            style={{
              left: dragPos.x,
              top: dragPos.y,
              transform: 'translate(-50%, -50%) scale(1.15)',
              width: `${Math.round(diskWidth(dragging.disk, maxDisk) * 1.44)}px`,
              height: '28px',
              background: `linear-gradient(135deg, ${DISK_COLORS[(dragging.disk - 1) % DISK_COLORS.length]!.bg}, ${DISK_COLORS[(dragging.disk - 1) % DISK_COLORS.length]!.shadow})`,
              boxShadow: `0 8px 24px ${DISK_COLORS[(dragging.disk - 1) % DISK_COLORS.length]!.shadow}bb`,
            }}
          >
            {dragging.disk}
          </div>
        )}

        {/* Spacing for base plates */}
        <div className="h-1" />
      </div>

      {/* Hint */}
      {!done && (
        <p className="text-center text-xs text-gray-400">
          {dragging
            ? `Suelta en el poste destino`
            : 'Arrastra el disco superior de un poste a otro'}
        </p>
      )}

      {/* Done */}
      {done && (
        <div className="animate-pop-in rounded-xl bg-green-50 border border-green-200 px-6 py-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-green-700">¡Puzzle resuelto!</p>
          <p className="text-sm text-green-600">
            {moves.length} movimientos · mínimo óptimo: {minMoves}
            {moves.length === minMoves && ' · ¡solución perfecta! ⭐'}
          </p>
        </div>
      )}
    </div>
  );
}
