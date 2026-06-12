import { useState, useEffect, useRef, useCallback } from 'react';
import { temporalOrientation } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  year: 'Año', season: 'Estación', month: 'Mes', dayOfWeek: 'Día de la semana',
  dayOfMonth: 'Día del mes', approximateTime: 'Momento del día',
};

export function TemporalOrientationPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => temporalOrientation.generate(level, seed));
  const [qIdx, setQIdx] = useState(0);
  const [responses, setResponses] = useState<temporalOrientation.TemporalOrientationResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const q = stimuli.questions[qIdx];
  useEffect(() => { startRef.current = performance.now(); }, [qIdx]);

  useEffect(() => {
    if (!done) return;
    const s = temporalOrientation.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (idx: number) => {
      if (!q || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      setResponses(prev => [...prev, { questionId: q.id, chosenIndex: idx, reactionTimeMs: rt }]);
      setFeedback(idx === q.correctIndex ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (qIdx + 1 >= stimuli.questions.length) setDone(true);
        else setQIdx(i => i + 1);
      }, 600);
    },
    [q, done, qIdx, stimuli.questions.length],
  );

  if (!q) return null;
  const bg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600 font-medium">{CATEGORY_LABELS[q.category] ?? q.category}</span>
        <span className="font-mono">{qIdx + 1} / {stimuli.questions.length}</span>
      </div>
      <div className={`mb-5 rounded-2xl border-2 p-5 ${bg}`}>
        <p className="text-lg font-semibold text-gray-800">{q.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => respond(i)} disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
