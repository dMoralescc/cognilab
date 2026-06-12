import { useState, useEffect } from 'react';
import { problemSolving } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function ProblemSolvingPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => problemSolving.generate(level, seed));
  const [scIdx, setScIdx] = useState(0);
  const [response, setResponse] = useState<problemSolving.ProblemSolvingResponse>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const summary = problemSolving.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (chosenIndex: number) => {
    const sc = stimuli.scenarios[scIdx];
    if (!sc) return;
    const next = [...response, { scenarioId: sc.id, chosenIndex }];
    setResponse(next);
    if (scIdx + 1 >= stimuli.scenarios.length) setDone(true);
    else setScIdx((i) => i + 1);
  };

  const currentSc = stimuli.scenarios[scIdx];
  if (!currentSc) return null;

  return (
    <div className="select-none">
      <p className="mb-2 text-center text-xs text-gray-400">{scIdx + 1} / {stimuli.scenarios.length}</p>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(scIdx / stimuli.scenarios.length) * 100}%` }} />
      </div>
      <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
        {currentSc.situation}
      </div>
      <div className="space-y-2">
        {currentSc.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => choose(i)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
