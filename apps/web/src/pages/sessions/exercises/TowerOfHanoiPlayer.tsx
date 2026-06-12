import { useState, useEffect } from 'react';
import { towerOfHanoi } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function TowerOfHanoiPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => towerOfHanoi.generate(level, seed));
  const [pegs, setPegs] = useState<number[][]>(() => stimuli.initialState.pegs.map((p) => [...p]));
  const [moves, setMoves] = useState<Array<[number, number]>>([]);
  const [selected, setSelected] = useState<number | null>(null);  // peg index
  const [illegalCount, setIllegalCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const summary = towerOfHanoi.summarize(stimuli, moves);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectPeg = (pegIdx: number) => {
    if (done) return;
    if (selected === null) {
      if ((pegs[pegIdx]?.length ?? 0) === 0) return;
      setSelected(pegIdx);
    } else {
      if (pegIdx === selected) { setSelected(null); return; }
      const fromPeg = pegs[selected]!;
      const toPeg = pegs[pegIdx]!;
      const disk = fromPeg[fromPeg.length - 1];
      const topTo = toPeg[toPeg.length - 1];
      if (disk === undefined) { setSelected(null); return; }
      if (topTo !== undefined && disk > topTo) {
        setIllegalCount((c) => c + 1);
        setSelected(null);
        return;
      }
      const newPegs = pegs.map((p) => [...p]);
      newPegs[selected]!.pop();
      newPegs[pegIdx]!.push(disk);
      const newMoves: Array<[number, number]> = [...moves, [selected, pegIdx]];
      setPegs(newPegs);
      setMoves(newMoves);
      setSelected(null);
      // Check if solved
      const goalPeg = newPegs[stimuli.goalPeg] ?? [];
      if (goalPeg.length === stimuli.diskCount) setDone(true);
    }
  };

  const diskColors = ['bg-indigo-600','bg-indigo-500','bg-indigo-400','bg-indigo-300','bg-indigo-200','bg-indigo-100'];

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>Mueve todos los discos al poste derecho</span>
        <span className="font-mono text-gray-400">{moves.length} movimientos · mín. {stimuli.minMoves}</span>
      </div>
      {illegalCount > 0 && <p className="mb-2 text-center text-xs text-red-500">Movimiento no permitido ({illegalCount} intento{illegalCount !== 1 ? 's' : ''} inválido{illegalCount !== 1 ? 's' : ''})</p>}

      <div className="flex justify-around gap-3 rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
        {pegs.map((peg, pegIdx) => {
          const isSel = selected === pegIdx;
          return (
            <button
              key={pegIdx}
              onClick={() => selectPeg(pegIdx)}
              className={`relative flex h-48 w-28 flex-col-reverse items-center justify-start gap-1 rounded-xl border-2 pt-2 transition-colors ${
                isSel ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              {/* Pole */}
              <div className="pointer-events-none absolute inset-x-1/2 top-2 bottom-2 w-1 -translate-x-1/2 rounded-full bg-gray-300" />
              {/* Disks */}
              {peg.map((disk, di) => {
                const width = 20 + disk * 14;
                return (
                  <div
                    key={di}
                    className={`z-10 h-5 rounded-full ${diskColors[disk - 1] ?? 'bg-gray-400'} flex items-center justify-center text-xs font-bold text-white`}
                    style={{ width: `${width}px` }}
                  >
                    {disk}
                  </div>
                );
              })}
              <span className="mt-1 text-xs text-gray-400">{['A','B','C'][pegIdx]}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-gray-400">
        {selected !== null ? `Poste ${['A','B','C'][selected]} seleccionado. Toca el destino.` : 'Toca un poste para seleccionarlo.'}
      </p>
    </div>
  );
}
