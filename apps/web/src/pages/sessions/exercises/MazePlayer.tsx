import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Build passage set once
  const passages = useMemo(() => {
    const wallSet = new Set(stimuli.walls.map((w) => `${w.from.row},${w.from.col}->${w.to.row},${w.to.col}`));
    const p = new Set<string>();
    for (let r = 0; r < stimuli.rows; r++) {
      for (let c = 0; c < stimuli.cols; c++) {
        for (const n of [{ row: r - 1, col: c }, { row: r + 1, col: c }, { row: r, col: c - 1 }, { row: r, col: c + 1 }]) {
          if (n.row < 0 || n.row >= stimuli.rows || n.col < 0 || n.col >= stimuli.cols) continue;
          if (!wallSet.has(`${r},${c}->${n.row},${n.col}`) && !wallSet.has(`${n.row},${n.col}->${r},${c}`)) {
            p.add(`${r},${c}->${n.row},${n.col}`);
          }
        }
      }
    }
    return p;
  }, [stimuli]);

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
        up:    { row: pos.row - 1, col: pos.col },
        down:  { row: pos.row + 1, col: pos.col },
        left:  { row: pos.row,     col: pos.col - 1 },
        right: { row: pos.row,     col: pos.col + 1 },
      }[dir];
      if (next.row < 0 || next.row >= stimuli.rows || next.col < 0 || next.col >= stimuli.cols) return;
      if (!passages.has(`${pos.row},${pos.col}->${next.row},${next.col}`)) {
        setErrors((e) => e + 1);
        return;
      }
      setPos(next);
      setPath((prev) => [...prev, next]);
    },
    [pos, done, stimuli.rows, stimuli.cols, passages],
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

  // Compute cell size to fit ~360px wide
  const CELL = Math.max(20, Math.min(52, Math.floor(360 / stimuli.cols)));
  const W = stimuli.cols * CELL;
  const H = stimuli.rows * CELL;

  const pathSet = new Set(path.map((p) => `${p.row},${p.col}`));

  return (
    <div className="select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Encuentra la salida 🏁 — flechas del teclado o botones</span>
        {errors > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
            {errors} error{errors !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Maze SVG */}
      <div className="flex justify-center">
        <div className="overflow-auto rounded-xl border-2 border-gray-200 bg-slate-50 p-1 shadow-inner">
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: 'block' }}
          >
            {/* Cell backgrounds */}
            {Array.from({ length: stimuli.rows }, (_, r) =>
              Array.from({ length: stimuli.cols }, (_, c) => {
                const isPlayer = pos.row === r && pos.col === c;
                const isEnd    = stimuli.end.row === r && stimuli.end.col === c;
                const isStart  = stimuli.start.row === r && stimuli.start.col === c;
                const isPath   = pathSet.has(`${r},${c}`) && !isPlayer;

                const fill = isPlayer ? '#6366f1'
                  : isEnd    ? '#d1fae5'
                  : isStart  ? '#fef9c3'
                  : isPath   ? '#e0e7ff'
                  : '#f8fafc';

                return (
                  <rect
                    key={`cell-${r}-${c}`}
                    x={c * CELL}
                    y={r * CELL}
                    width={CELL}
                    height={CELL}
                    fill={fill}
                  />
                );
              })
            )}

            {/* Walls — using correct SVG line coordinates */}
            {stimuli.walls.map((w, i) => {
              const sameRow = w.from.row === w.to.row;
              if (sameRow) {
                // Cells share a row → wall is a vertical segment between them
                const wallCol = Math.max(w.from.col, w.to.col);
                const wallRow = w.from.row;
                return (
                  <line
                    key={`w${i}`}
                    x1={wallCol * CELL} y1={wallRow * CELL}
                    x2={wallCol * CELL} y2={(wallRow + 1) * CELL}
                    stroke="#334155" strokeWidth={2} strokeLinecap="round"
                  />
                );
              } else {
                // Cells share a column → wall is a horizontal segment between them
                const wallRow = Math.max(w.from.row, w.to.row);
                const wallCol = w.from.col;
                return (
                  <line
                    key={`w${i}`}
                    x1={wallCol * CELL}       y1={wallRow * CELL}
                    x2={(wallCol + 1) * CELL} y2={wallRow * CELL}
                    stroke="#334155" strokeWidth={2} strokeLinecap="round"
                  />
                );
              }
            })}

            {/* Outer border */}
            <rect x={0} y={0} width={W} height={H} fill="none" stroke="#1e293b" strokeWidth={3} />

            {/* Player circle */}
            <circle
              cx={(pos.col + 0.5) * CELL}
              cy={(pos.row + 0.5) * CELL}
              r={CELL * 0.32}
              fill="#6366f1"
            />
            {/* Player dot highlight */}
            <circle
              cx={(pos.col + 0.35) * CELL}
              cy={(pos.row + 0.35) * CELL}
              r={CELL * 0.08}
              fill="white"
              opacity={0.5}
            />

            {/* End flag emoji */}
            <text
              x={(stimuli.end.col + 0.5) * CELL}
              y={(stimuli.end.row + 0.5) * CELL + CELL * 0.18}
              textAnchor="middle"
              fontSize={CELL * 0.55}
            >
              🏁
            </text>
          </svg>
        </div>
      </div>

      {/* D-pad */}
      <div className="mx-auto grid w-36 grid-cols-3 gap-1.5">
        <div />
        <button
          onClick={() => move('up')}
          className="flex h-11 items-center justify-center rounded-xl bg-gray-100 text-xl shadow-sm transition-all hover:bg-indigo-100 active:scale-90 active:bg-indigo-200"
        >↑</button>
        <div />
        <button
          onClick={() => move('left')}
          className="flex h-11 items-center justify-center rounded-xl bg-gray-100 text-xl shadow-sm transition-all hover:bg-indigo-100 active:scale-90 active:bg-indigo-200"
        >←</button>
        <div className="flex h-11 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-300">●</div>
        <button
          onClick={() => move('right')}
          className="flex h-11 items-center justify-center rounded-xl bg-gray-100 text-xl shadow-sm transition-all hover:bg-indigo-100 active:scale-90 active:bg-indigo-200"
        >→</button>
        <div />
        <button
          onClick={() => move('down')}
          className="flex h-11 items-center justify-center rounded-xl bg-gray-100 text-xl shadow-sm transition-all hover:bg-indigo-100 active:scale-90 active:bg-indigo-200"
        >↓</button>
        <div />
      </div>

      {done && (
        <p className="text-center text-base font-semibold text-green-600">¡Salida encontrada! 🎉</p>
      )}
    </div>
  );
}
