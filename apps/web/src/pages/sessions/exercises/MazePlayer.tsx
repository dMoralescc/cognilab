import { useState, useEffect, useCallback } from 'react';
import { maze } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Dir = 'up' | 'down' | 'left' | 'right';

export function MazePlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => maze.generate(level, seed));
  const [pos, setPos] = useState(stimuli.start);
  const [path, setPath] = useState([stimuli.start]);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const [startMs] = useState(Date.now());

  // Build passage set for quick lookup
  const passages = new Set<string>();
  // Reconstruct from solution + walls: easier to invert walls to passages
  // We'll use solution path for walkability hint; actually need full passages from walls
  // Build from stimuli.walls negation:
  const wallSet = new Set(stimuli.walls.map(w => `${w.from.row},${w.from.col}->${w.to.row},${w.to.col}`));
  for (let r = 0; r < stimuli.rows; r++) {
    for (let c = 0; c < stimuli.cols; c++) {
      const neighbors = [{ row: r - 1, col: c }, { row: r + 1, col: c }, { row: r, col: c - 1 }, { row: r, col: c + 1 }];
      for (const n of neighbors) {
        if (n.row < 0 || n.row >= stimuli.rows || n.col < 0 || n.col >= stimuli.cols) continue;
        const fwd = `${r},${c}->${n.row},${n.col}`;
        const bwd = `${n.row},${n.col}->${r},${c}`;
        if (!wallSet.has(fwd) && !wallSet.has(bwd)) passages.add(fwd);
      }
    }
  }

  const canMove = (from: maze.Cell, to: maze.Cell) =>
    passages.has(`${from.row},${from.col}->${to.row},${to.col}`);

  useEffect(() => {
    if (!done) return;
    const s = maze.summarize(stimuli, { path, elapsedMs: Date.now() - startMs, errors });
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pos.row === stimuli.end.row && pos.col === stimuli.end.col) setDone(true);
  }, [pos, stimuli.end.row, stimuli.end.col]);

  const move = useCallback(
    (dir: Dir) => {
      if (done) return;
      const next = {
        up: { row: pos.row - 1, col: pos.col },
        down: { row: pos.row + 1, col: pos.col },
        left: { row: pos.row, col: pos.col - 1 },
        right: { row: pos.row, col: pos.col + 1 },
      }[dir];
      if (next.row < 0 || next.row >= stimuli.rows || next.col < 0 || next.col >= stimuli.cols) return;
      if (!canMove(pos, next)) { setErrors((e) => e + 1); return; }
      setPos(next);
      setPath((prev) => [...prev, next]);
    },
    [pos, done, stimuli.rows, stimuli.cols, canMove],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); move(dir); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const cellSize = Math.min(32, Math.floor(280 / stimuli.cols));

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>Encuentra la salida — usa las flechas del teclado o los botones</span>
        <span className="font-mono">Errores: {errors}</span>
      </div>

      {/* Maze grid */}
      <div className="mx-auto mb-4 overflow-auto" style={{ width: `${stimuli.cols * cellSize + 4}px` }}>
        <div className="relative" style={{ width: `${stimuli.cols * cellSize}px`, height: `${stimuli.rows * cellSize}px` }}>
          {Array.from({ length: stimuli.rows }, (_, r) =>
            Array.from({ length: stimuli.cols }, (_, c) => {
              const isPlayer = pos.row === r && pos.col === c;
              const isEnd = stimuli.end.row === r && stimuli.end.col === c;
              const isStart = stimuli.start.row === r && stimuli.start.col === c;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`absolute flex items-center justify-center text-xs font-bold ${
                    isPlayer ? 'bg-indigo-500 text-white rounded' :
                    isEnd ? 'bg-green-200 rounded' :
                    isStart ? 'bg-yellow-100 rounded' : ''
                  }`}
                  style={{ left: c * cellSize, top: r * cellSize, width: cellSize, height: cellSize, fontSize: cellSize * 0.4 }}
                >
                  {isPlayer ? '●' : isEnd ? '🏁' : null}
                </div>
              );
            })
          )}
          {/* Draw walls */}
          {stimuli.walls.map((w, i) => {
            const isVertical = w.from.col !== w.to.col;
            const col = Math.max(w.from.col, w.to.col);
            const row = Math.max(w.from.row, w.to.row);
            return isVertical ? (
              <div key={i} className="absolute bg-gray-800"
                style={{ left: col * cellSize, top: row * cellSize - cellSize, width: 2, height: cellSize }} />
            ) : (
              <div key={i} className="absolute bg-gray-800"
                style={{ left: row * cellSize - cellSize, top: col * cellSize, width: cellSize, height: 2 }} />
            );
          })}
        </div>
      </div>

      {/* D-pad for touch */}
      <div className="mx-auto grid w-28 grid-cols-3 gap-1">
        <div />
        <button onClick={() => move('up')} className="rounded bg-gray-100 p-2 text-center text-lg hover:bg-gray-200">↑</button>
        <div />
        <button onClick={() => move('left')} className="rounded bg-gray-100 p-2 text-center text-lg hover:bg-gray-200">←</button>
        <div />
        <button onClick={() => move('right')} className="rounded bg-gray-100 p-2 text-center text-lg hover:bg-gray-200">→</button>
        <div />
        <button onClick={() => move('down')} className="rounded bg-gray-100 p-2 text-center text-lg hover:bg-gray-200">↓</button>
        <div />
      </div>
    </div>
  );
}
