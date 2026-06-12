import { useState, useEffect, useRef, useCallback } from 'react';
import { prospectiveMemory } from '@cognilab/shared';

interface Props {
  level: number;
  seed: number;
  onComplete: (r: { hits: number; errors: number; reactionTimeMs: number | null; rawData: Record<string, unknown> }) => void;
}

type Phase = 'stimulus' | 'done';

const COLOR_LABELS: Record<string, string> = { rojo: 'Rojo', azul: 'Azul', verde: 'Verde', amarillo: 'Amarillo', naranja: 'Naranja' };
const COLORS: Array<'rojo'|'azul'|'verde'|'amarillo'|'naranja'> = ['rojo','azul','verde','amarillo','naranja'];

export function ProspectiveMemoryPlayer({ level, seed, onComplete }: Props) {
  const [{ stimuli }] = useState(() => prospectiveMemory.generate(level, seed));
  const [trialIdx, setTrialIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('stimulus');
  const [responses, setResponses] = useState<prospectiveMemory.ProspectiveMemoryResponse>([]);
  const [prospectivePressed, setProspectivePressed] = useState(false);
  const startRef = useRef(performance.now());

  const currentTrial = stimuli.trials[trialIdx];

  useEffect(() => { startRef.current = performance.now(); setProspectivePressed(false); }, [trialIdx]);

  useEffect(() => {
    if (phase !== 'done') return;
    const summary = prospectiveMemory.summarize(stimuli, responses);
    onComplete({ hits: summary.hits, errors: summary.errors, reactionTimeMs: null, rawData: summary.rawData });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const respond = useCallback(
    (mainResponse: string, prospectiveResponse: boolean) => {
      if (!currentTrial) return;
      const rt = Math.round(performance.now() - startRef.current);
      const next = [...responses, { trialId: currentTrial.id, mainResponse, prospectiveResponse, reactionTimeMs: rt }];
      setResponses(next);
      if (trialIdx + 1 >= stimuli.trials.length) setPhase('done');
      else setTrialIdx((i) => i + 1);
    },
    [currentTrial, responses, trialIdx, stimuli.trials.length],
  );

  if (!currentTrial) return null;

  return (
    <div className="select-none">
      <div className="mb-3 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm text-yellow-800">
        Recuerda: pulsa el botón especial si aparece una de estas palabras:{' '}
        <strong>{stimuli.intentions.join(', ')}</strong>
      </div>

      <div className="mb-2 flex items-center justify-between text-xs text-gray-400">
        <span>{trialIdx + 1} / {stimuli.trials.length}</span>
      </div>

      <div className="mb-4 flex h-24 items-center justify-center gap-6 rounded-2xl border-2 border-gray-200 bg-gray-50">
        <span className={`text-4xl font-bold ${
          currentTrial.mainColor === 'rojo' ? 'text-red-500' :
          currentTrial.mainColor === 'azul' ? 'text-blue-500' :
          currentTrial.mainColor === 'verde' ? 'text-green-500' :
          currentTrial.mainColor === 'amarillo' ? 'text-yellow-500' : 'text-orange-500'
        }`}>■</span>
        {currentTrial.cueWord && (
          <span className="rounded-lg bg-yellow-100 px-3 py-1 text-xl font-bold text-yellow-800">{currentTrial.cueWord}</span>
        )}
      </div>

      {/* Prospective button */}
      {!prospectivePressed && (
        <button
          onClick={() => { setProspectivePressed(true); }}
          className="mb-3 w-full rounded-xl border-2 border-yellow-400 bg-yellow-50 py-2 text-sm font-semibold text-yellow-800 hover:bg-yellow-100"
        >
          ★ Pulsar (intención prospectiva)
        </button>
      )}

      {/* Main task buttons */}
      <div className="grid grid-cols-3 gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => respond(c, prospectivePressed)}
            className="rounded-xl border-2 border-gray-200 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {COLOR_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
