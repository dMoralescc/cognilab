import { useState, useEffect, useRef, useCallback } from 'react';
import { cognitiveFlexibility } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

const SHAPE_LABELS: Record<string, string> = { circle: '●', square: '■', triangle: '▲', star: '★' };
const COLOR_CSS: Record<string, string> = { red: 'text-red-500', blue: 'text-blue-500', green: 'text-green-500', yellow: 'text-yellow-500' };

function CardDisplay({ card, small = false }: { card: cognitiveFlexibility.FlexibilityCard; small?: boolean }) {
  const s = small ? 'text-2xl' : 'text-3xl';
  const repeat = card.count;
  return (
    <div className="flex flex-col items-center gap-0.5">
      {Array.from({ length: repeat }, (_, i) => (
        <span key={i} className={`${s} font-bold ${COLOR_CSS[card.color] ?? ''}`}>
          {SHAPE_LABELS[card.shape]}
        </span>
      ))}
    </div>
  );
}

export function CognitiveFlexibilityPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => cognitiveFlexibility.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [responses, setResponses] = useState<cognitiveFlexibility.CognitiveFlexibilityResponse>([]);
  const [feedback, setFeedback] = useState<'correct' | 'error' | null>(null);
  const startRef = useRef(performance.now());
  const [done, setDone] = useState(false);

  const currentTrial = stimuli.trials[trialIdx];
  useEffect(() => { startRef.current = performance.now(); }, [trialIdx]);

  useEffect(() => {
    if (!done) return;
    const summary = cognitiveFlexibility.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: summary.reactionTimeMs, rawData: summary.rawData });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (chosenIndex: number) => {
      if (!currentTrial || done) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { trialId: currentTrial.id, chosenIndex, reactionTimeMs: rt }];
      setResponses(next);
      setFeedback(chosenIndex === currentTrial.correctIndex ? 'correct' : 'error');
      setTimeout(() => setFeedback(null), 250);
      if (trialIdx + 1 >= stimuli.trials.length) setDone(true);
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, done, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;
  const RULE_LABELS: Record<string, string> = { color: 'Color', shape: 'Forma', count: 'Cantidad' };
  const bg = feedback === 'correct' ? 'bg-green-50' : feedback === 'error' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        {currentTrial.showRule ? (
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
            Clasifica por: {RULE_LABELS[currentTrial.currentRule]}
          </span>
        ) : <span className="text-xs text-gray-400">Adivina la regla actual</span>}
        <span className="font-mono text-gray-400">{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      <div className={`mb-5 flex h-24 items-center justify-center rounded-2xl border-2 border-gray-200 ${bg}`}>
        <CardDisplay card={currentTrial.card} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currentTrial.referenceCards.map((ref, i) => (
          <button
            key={i}
            onClick={() => respond(i)}
            className="flex h-20 items-center justify-center rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50"
          >
            <CardDisplay card={ref} small />
          </button>
        ))}
      </div>
    </div>
  );
}
