import { useState, useEffect, useRef, useCallback } from 'react';
import { puzzle } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

interface PlacedPiece { pieceId: number; placedRow: number; placedCol: number }

export function PuzzlePlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => puzzle.generate(level, seed));
  // board[row][col] = pieceId or null
  const [board, setBoard] = useState<(number | null)[][]>(() =>
    Array.from({ length: stimuli.rows }, () => Array(stimuli.cols).fill(null))
  );
  const [tray, setTray] = useState<puzzle.PuzzlePiece[]>(stimuli.pieces);
  const [selected, setSelected] = useState<number | null>(null); // pieceId from tray
  const [done, setDone] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!done) return;
    const placements: PlacedPiece[] = [];
    for (let r = 0; r < stimuli.rows; r++) {
      for (let c = 0; c < stimuli.cols; c++) {
        const pid = board[r]?.[c];
        if (pid !== null && pid !== undefined) placements.push({ pieceId: pid, placedRow: r, placedCol: c });
      }
    }
    const elapsed = Date.now() - startRef.current;
    const s = puzzle.summarize(stimuli, { placements, elapsedMs: elapsed });
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const placePiece = useCallback(
    (row: number, col: number) => {
      if (selected === null || board[row]?.[col] !== null) return;
      setBoard((prev) => {
        const next = prev.map(r => [...r]);
        next[row]![col] = selected;
        return next;
      });
      setTray((prev) => prev.filter(p => p.id !== selected));
      setSelected(null);
    },
    [selected, board],
  );

  const removePiece = useCallback(
    (row: number, col: number) => {
      const pid = board[row]?.[col];
      if (pid === null || pid === undefined) return;
      const piece = stimuli.pieces.find(p => p.id === pid);
      if (!piece) return;
      setBoard((prev) => {
        const next = prev.map(r => [...r]);
        next[row]![col] = null;
        return next;
      });
      setTray((prev) => [...prev, piece]);
      setSelected(null);
    },
    [board, stimuli.pieces],
  );

  const pieceMap = new Map(stimuli.pieces.map(p => [p.id, p]));
  const totalCells = stimuli.rows * stimuli.cols;
  const placed = tray.length === 0 || (totalCells - tray.length);

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>Coloca las piezas para reconstruir: <strong>{stimuli.imageName}</strong> {stimuli.imageEmoji}</span>
        <span className="font-mono">{totalCells - tray.length} / {totalCells}</span>
      </div>

      {/* Board */}
      <div
        className="mx-auto mb-4 inline-grid gap-1 rounded-xl border-2 border-gray-200 bg-gray-100 p-2"
        style={{ gridTemplateColumns: `repeat(${stimuli.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: stimuli.rows }, (_, r) =>
          Array.from({ length: stimuli.cols }, (_, c) => {
            const pid = board[r]?.[c];
            const piece = pid !== null && pid !== undefined ? pieceMap.get(pid) : null;
            return (
              <div
                key={`${r}-${c}`}
                onClick={() => piece ? removePiece(r, c) : placePiece(r, c)}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 text-2xl ${
                  piece ? 'border-indigo-300 bg-white' : selected !== null ? 'border-dashed border-indigo-300 bg-indigo-50' : 'border-dashed border-gray-300 bg-white'
                }`}
                style={piece ? { transform: `rotate(${piece.rotation}deg)` } : undefined}
              >
                {piece ? stimuli.imageEmoji : null}
              </div>
            );
          })
        )}
      </div>

      {/* Tray */}
      {tray.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs text-gray-400">Piezas disponibles — toca para seleccionar, luego toca una casilla del tablero</p>
          <div className="flex flex-wrap justify-center gap-2">
            {tray.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 text-2xl transition-colors ${
                  selected === p.id ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
                style={{ transform: `rotate(${p.rotation}deg)` }}
              >
                {stimuli.imageEmoji}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setDone(true)}
        disabled={done}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
      >
        {placed === totalCells ? 'Completado — continuar' : `Finalizar (${placed}/${totalCells} piezas)`}
      </button>
    </div>
  );
}
