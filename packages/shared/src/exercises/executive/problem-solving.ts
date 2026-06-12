import type { ExerciseContent, TrialResult, ExerciseSummary } from '../../types/exercise';

export interface ProblemScenario {
  id: number;
  situation: string;
  options: string[];
  bestOptionIndex: number;
  explanation: string;
}

export interface ProblemSolvingStimuli {
  scenarios: ProblemScenario[];
  timeLimit: number;
}

export type ProblemSolvingResponse = Array<{ scenarioId: number; chosenIndex: number }>;

const ALL_SCENARIOS: ProblemScenario[] = [
  {
    id: 0,
    situation: 'Tienes una cita médica en 30 minutos pero tu coche no arranca. ¿Qué haces?',
    options: ['Esperar a que se arregle solo', 'Llamar a un taxi o usar transporte público', 'Cancelar la cita', 'Pedir prestado el coche a un vecino mañana'],
    bestOptionIndex: 1,
    explanation: 'Llamar a un taxi o usar transporte público es la solución más inmediata y práctica.',
  },
  {
    id: 1,
    situation: 'Se va la luz en casa durante una tormenta. ¿Qué haces?',
    options: ['Salir a la calle para ver qué pasa', 'Buscar velas o linterna y llamar a la compañía eléctrica', 'Ignorarlo y seguir con lo que estabas haciendo', 'Abrir la caja de fusibles sin saber de electricidad'],
    bestOptionIndex: 1,
    explanation: 'Usar una fuente de luz alternativa y notificar a la compañía es lo más seguro.',
  },
  {
    id: 2,
    situation: 'Descubres que has perdido tu cartera con tu DNI y tarjetas. ¿Qué haces?',
    options: ['Esperar a que aparezca', 'Llamar al banco para bloquear las tarjetas y denunciarlo en comisaría', 'Pedir dinero prestado a amigos', 'Ignorarlo por ahora'],
    bestOptionIndex: 1,
    explanation: 'Bloquear las tarjetas de inmediato y denunciar son pasos prioritarios.',
  },
  {
    id: 3,
    situation: 'Te das cuenta de que has enviado un correo importante a la persona equivocada. ¿Qué haces?',
    options: ['No hacer nada y esperar', 'Contactar al destinatario equivocado y pedir que lo borre, luego reenviar al correcto', 'Culpar al sistema informático', 'Borrar tu cuenta de correo'],
    bestOptionIndex: 1,
    explanation: 'Gestionar el error directamente y corregirlo es la solución más profesional.',
  },
  {
    id: 4,
    situation: 'Tienes que tomar una decisión importante pero no tienes suficiente información. ¿Qué haces?',
    options: ['Decidir al azar', 'Buscar más información antes de decidir', 'Posponer indefinidamente', 'Dejar que otros decidan por ti siempre'],
    bestOptionIndex: 1,
    explanation: 'Obtener información adicional mejora la calidad de la decisión.',
  },
  {
    id: 5,
    situation: 'Hay un conflicto entre dos compañeros de trabajo que afecta al equipo. ¿Qué haces?',
    options: ['Ignorar el conflicto completamente', 'Hablar con cada parte por separado y luego facilitar una conversación conjunta', 'Tomar partido por uno de ellos', 'Contarlo a todos los demás'],
    bestOptionIndex: 1,
    explanation: 'La mediación imparcial es la estrategia más efectiva para resolver conflictos.',
  },
];

interface LevelParams { scenarioCount: number; fromIdx: number; timeLimit: number }
const LEVEL_PARAMS: Record<number, LevelParams> = {
  1: { scenarioCount: 3, fromIdx: 0, timeLimit: 90 },
  2: { scenarioCount: 4, fromIdx: 0, timeLimit: 100 },
  3: { scenarioCount: 4, fromIdx: 2, timeLimit: 100 },
  4: { scenarioCount: 5, fromIdx: 1, timeLimit: 110 },
  5: { scenarioCount: 6, fromIdx: 0, timeLimit: 120 },
};

export function generate(level: number, _seed: number): ExerciseContent<ProblemSolvingStimuli> {
  const p = LEVEL_PARAMS[level] ?? LEVEL_PARAMS[1]!;
  const scenarios = ALL_SCENARIOS.slice(p.fromIdx, p.fromIdx + p.scenarioCount);
  return { level, seed: _seed, timeLimit: p.timeLimit, stimuli: { scenarios, timeLimit: p.timeLimit } };
}

export function evaluate(s: ProblemSolvingStimuli, r: ProblemSolvingResponse): TrialResult<ProblemSolvingStimuli, ProblemSolvingResponse> {
  const { hits, errors } = computeMetrics(s, r);
  void hits;
  return { isCorrect: errors === 0, reactionTimeMs: 0, stimulus: s, response: r };
}

export function summarize(s: ProblemSolvingStimuli, r: ProblemSolvingResponse): ExerciseSummary {
  const { hits, errors } = computeMetrics(s, r);
  return { hits, errors, reactionTimeMs: null, rawData: { scenarioCount: s.scenarios.length } };
}

function computeMetrics(s: ProblemSolvingStimuli, r: ProblemSolvingResponse) {
  const map = new Map(r.map((x) => [x.scenarioId, x]));
  let hits = 0, errors = 0;
  for (const sc of s.scenarios) {
    if (map.get(sc.id)?.chosenIndex === sc.bestOptionIndex) hits++;
    else errors++;
  }
  return { hits, errors };
}
