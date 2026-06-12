import { useState, useEffect } from 'react';
import { imagePairs } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'study' | 'delay' | 'recall' | 'done';

export function ImagePairsPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => imagePairs.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('study');
  const [response, setResponse] = useState<imagePairs.ImagePairsResponse>([]);
  const [currentPairIdx, setCurrentPairIdx] = useState(0);

  // All right-side emojis shuffled as options
  const [options] = useState(() => {
    const all = [...stimuli.pairs.map((p) => p.rightEmoji)];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = all[i] as string; all[i] = all[j] as string; all[j] = tmp;
    }
    return all;
  });

  useEffect(() => {
    if (phase === 'study') {
      const t = setTimeout(() => setPhase('delay'), stimuli.exposureTimeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'delay') {
      const t = setTimeout(() => setPhase('recall'), stimuli.delayTimeMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.exposureTimeMs, stimuli.delayTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = imagePairs.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const choosePair = (chosen: string) => {
    const pair = stimuli.pairs[currentPairIdx];
    if (!pair) return;
    const next = [...response, { pairId: pair.id, chosen }];
    setResponse(next);
    if (currentPairIdx + 1 >= stimuli.pairs.length) setPhase('done');
    else setCurrentPairIdx((i) => i + 1);
  };

  const currentPair = stimuli.pairs[currentPairIdx];

  return (
    <div className="select-none text-center">
      {phase === 'study' && (
        <>
          <p className="mb-4 text-sm text-gray-600">Memoriza los pares de imágenes</p>
          <div className="grid grid-cols-2 gap-3">
            {stimuli.pairs.map((p) => (
              <div key={p.id} className="flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <span className="text-3xl">{p.leftEmoji}</span>
                <span className="text-gray-400">↔</span>
                <span className="text-3xl">{p.rightEmoji}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'delay' && (
        <div className="flex h-48 items-center justify-center">
          <p className="text-xl text-gray-400">Preparando test...</p>
        </div>
      )}

      {phase === 'recall' && currentPair && (
        <>
          <p className="mb-3 text-sm text-gray-600">
            ¿Con qué imagen iba emparejado {currentPair.leftEmoji}?
            <span className="ml-2 text-xs text-gray-400">({currentPairIdx + 1}/{stimuli.pairs.length})</span>
          </p>
          <div className="mb-4 flex h-20 items-center justify-center text-5xl">{currentPair.leftEmoji}</div>
          <div className="grid grid-cols-4 gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => choosePair(opt)}
                className="h-14 rounded-xl bg-gray-50 text-3xl hover:bg-indigo-50"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
