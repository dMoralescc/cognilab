import { useState, useEffect, useRef, useCallback } from 'react';
import { emotionRecognition } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

export function EmotionRecognitionPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => emotionRecognition.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<emotionRecognition.EmotionRecognitionResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const t = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);
  useEffect(() => {
    if (!done) return;
    const s = emotionRecognition.summarize(stimuli, responses);
    onComplete({ hits: s.hits, errors: s.errors, reactionTimeMs: s.reactionTimeMs, rawData: s.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback((emotion: emotionRecognition.BasicEmotion) => {
    if (!t || done) return;
    const rt = Math.round(performance.now() - startRef.current);
    setResponses(prev => [...prev, { trialId: t.id, chosenEmotion: emotion, reactionTimeMs: rt }]);
    setFeedback(emotion === t.emotion ? 'correct' : 'error');
    setTimeout(() => { setFeedback(null); if (trialIdx + 1 >= stimuli.trials.length) setDone(true); else setTrialIdx(i => i + 1); }, 500);
  }, [t, done, trialIdx, stimuli.trials.length]);

  if (!t) return null;
  const bg = feedback === 'correct' ? 'bg-green-50 border-green-300' : feedback === 'error' ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200';
  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
        <span>¿Qué emoción expresa esta cara?</span>
        <span className="font-mono">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>
      <div className={`mb-5 flex h-36 items-center justify-center rounded-2xl border-2 ${bg}`}>
        <span className="text-8xl">{t.faceEmoji}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {t.options.map((opt) => (
          <button key={opt} onClick={() => respond(opt)} disabled={feedback !== null}
            className="rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-medium capitalize text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
