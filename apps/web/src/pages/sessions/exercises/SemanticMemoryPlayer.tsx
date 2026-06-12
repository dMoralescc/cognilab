import { useState, useEffect } from 'react';
import { semanticMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function SemanticMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => semanticMemory.generate(level, seed));
  const [qIdx, setQIdx] = useState(0);
  const [response, setResponse] = useState<semanticMemory.SemanticMemoryResponse>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const summary = semanticMemory.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (chosen: string) => {
    const q = stimuli.questions[qIdx];
    if (!q) return;
    const next = [...response, { questionId: q.id, chosen }];
    setResponse(next);
    if (qIdx + 1 >= stimuli.questions.length) setDone(true);
    else setQIdx((i) => i + 1);
  };

  const currentQ = stimuli.questions[qIdx];
  if (!currentQ) return null;

  return (
    <div className="select-none">
      <p className="mb-2 text-center text-xs text-gray-400">
        Pregunta {qIdx + 1} de {stimuli.questions.length}
      </p>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(qIdx / stimuli.questions.length) * 100}%` }} />
      </div>
      <p className="mb-6 text-center text-lg font-semibold text-gray-800">{currentQ.question}</p>
      <div className="space-y-2">
        {currentQ.options.map((opt) => (
          <button
            key={opt}
            onClick={() => answer(opt)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
