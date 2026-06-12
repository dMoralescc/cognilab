import { useState, useEffect, useRef, useCallback } from 'react';
import { reading } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'reading' | 'questions';

export function ReadingPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => reading.generate(level, seed));
  const [phase, setPhase] = useState<Phase>('reading');
  const [readingTimeLeft, setReadingTimeLeft] = useState(stimuli.readingTimeLimit);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [responses, setResponses] = useState<reading.ReadingResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (phase !== 'reading') return;
    const id = setInterval(() => {
      setReadingTimeLeft((t) => {
        if (t <= 1) { setPhase('questions'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'questions') startRef.current = performance.now();
  }, [phase, questionIdx]);

  useEffect(() => {
    if (!done) return;
    const s = reading.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      const q = stimuli.questions[questionIdx];
      if (!q || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { questionId: q.id, chosenIndex, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosenIndex === q.correctIndex ? 'correct' : 'error');
      setTimeout(() => {
        setFeedback(null);
        if (questionIdx + 1 >= stimuli.questions.length) setDone(true);
        else setQuestionIdx((i) => i + 1);
      }, 600);
    },
    [stimuli.questions, questionIdx, done, responses],
  );

  if (phase === 'reading') {
    return (
      <div className="select-none">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{stimuli.title}</span>
          <span className={`text-sm font-mono ${readingTimeLeft <= 10 ? 'text-red-500' : 'text-gray-400'}`}>{readingTimeLeft}s</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${(readingTimeLeft / stimuli.readingTimeLimit) * 100}%` }} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {stimuli.text}
        </div>
        <button
          onClick={() => setPhase('questions')}
          className="mt-4 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ya lo leí, responder preguntas
        </button>
      </div>
    );
  }

  const q = stimuli.questions[questionIdx];
  if (!q) return null;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>{q.isInferential ? 'Pregunta inferencial' : 'Comprensión'}</span>
        <span className="font-mono">{questionIdx + 1} / {stimuli.questions.length}</span>
      </div>
      <div className={`mb-5 rounded-2xl border-2 border-gray-200 p-4 ${feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50'}`}>
        <p className="font-medium text-gray-800">{q.question}</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
