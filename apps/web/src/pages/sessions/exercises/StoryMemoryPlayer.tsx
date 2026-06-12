import { useState, useEffect } from 'react';
import { storyMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'read' | 'delay' | 'questions' | 'done';

export function StoryMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => storyMemory.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('read');
  const [qIdx, setQIdx] = useState(0);
  const [response, setResponse] = useState<storyMemory.StoryMemoryResponse>([]);

  useEffect(() => {
    if (phase === 'read') {
      const t = setTimeout(() => setPhase('delay'), stimuli.studyTimeMs);
      return () => clearTimeout(t);
    }
    if (phase === 'delay') {
      const t = setTimeout(() => setPhase('questions'), stimuli.delayTimeMs);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, stimuli.studyTimeMs, stimuli.delayTimeMs]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = storyMemory.summarize(stimuli, response);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (chosen: string) => {
    const q = stimuli.questions[qIdx];
    if (!q) return;
    const next = [...response, { questionId: q.id, chosen }];
    setResponse(next);
    if (qIdx + 1 >= stimuli.questions.length) setPhase('done');
    else setQIdx((i) => i + 1);
  };

  const currentQ = stimuli.questions[qIdx];

  return (
    <div className="select-none">
      {phase === 'read' && (
        <>
          <p className="mb-3 text-center text-sm text-gray-600">Lee con atención esta historia</p>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-base leading-relaxed text-gray-800">
            {stimuli.story}
          </div>
        </>
      )}

      {phase === 'delay' && (
        <div className="flex h-48 items-center justify-center">
          <p className="text-xl text-gray-400">Preparando preguntas...</p>
        </div>
      )}

      {phase === 'questions' && currentQ && (
        <>
          <p className="mb-2 text-center text-xs text-gray-400">
            Pregunta {qIdx + 1} de {stimuli.questions.length}
          </p>
          <p className="mb-5 text-center text-base font-semibold text-gray-800">{currentQ.question}</p>
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
        </>
      )}
    </div>
  );
}
