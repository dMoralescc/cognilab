import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type ToMOrder = 1 | 2 | 3;
export type ToMTaskType = 'belief' | 'faux_pas' | 'irony';

export interface ToMScenario {
  id: number;
  order: ToMOrder;
  taskType: ToMTaskType;
  story: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TheoryOfMindStimuli {
  scenarios: ToMScenario[];
  timePerScenario: number;
}

export interface ToMTrialResponse {
  scenarioId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type TheoryOfMindResponse = ToMTrialResponse[];

const SCENARIO_BANK: Omit<ToMScenario, 'id'>[] = [
  // Order 1 — first-order belief
  { order: 1, taskType: 'belief',
    story: 'Ana pone una manzana en la caja roja y luego sale de la habitación. Mientras Ana está fuera, Pedro mueve la manzana a la caja azul.',
    question: '¿Dónde buscará Ana la manzana cuando vuelva?',
    options: ['En la caja roja', 'En la caja azul', 'En el suelo', 'No la buscará'],
    correctIndex: 0 },
  { order: 1, taskType: 'belief',
    story: 'Luis guarda su dinero debajo de la almohada. Su madre, sin que Luis lo sepa, lo traslada al cajón.',
    question: '¿Dónde buscará Luis su dinero?',
    options: ['En el cajón', 'Debajo de la almohada', 'En la cartera', 'En la nevera'],
    correctIndex: 1 },
  // Order 2 — second-order belief
  { order: 2, taskType: 'belief',
    story: 'Juan piensa que María cree que el gato está en el jardín. En realidad el gato está en casa.',
    question: '¿Dónde cree Juan que María buscará el gato?',
    options: ['En el jardín', 'En casa', 'En la calle', 'En casa del vecino'],
    correctIndex: 0 },
  { order: 2, taskType: 'belief',
    story: 'Pedro sabe que su jefa cree que él está en la oficina, pero en realidad está en el médico.',
    question: '¿Dónde cree Pedro que su jefa piensa que está él?',
    options: ['En el médico', 'En casa', 'En la oficina', 'De viaje'],
    correctIndex: 2 },
  // Faux pas
  { order: 2, taskType: 'faux_pas',
    story: 'Clara le dice a su amiga Sofía: "¡Qué horrible vestido el de tu madre en la boda!" Sin saber que la madre de Sofía había elegido ese vestido con mucho cariño.',
    question: '¿Hizo Clara algo socialmente inapropiado?',
    options: ['No, fue honesta', 'Sí, dijo algo que podría herir sin darse cuenta', 'No, tenía razón', 'Sí, pero lo hizo a propósito'],
    correctIndex: 1 },
  { order: 2, taskType: 'faux_pas',
    story: 'Miguel pregunta en voz alta en una reunión: "¿Quién es el que siempre llega tarde?" La persona que siempre llega tarde está sentada justo a su lado.',
    question: '¿Qué error social cometió Miguel?',
    options: ['Ninguno, es una pregunta válida', 'Avergonzó a alguien sin querer', 'Interrumpió la reunión deliberadamente', 'Mintió sobre los hechos'],
    correctIndex: 1 },
  // Irony
  { order: 3, taskType: 'irony',
    story: 'Llueve a cántaros y Elena sale sin paraguas. Al llegar empapada, su hermano dice: "¡Qué tiempo tan estupendo hoy!"',
    question: '¿Qué quería decir realmente el hermano de Elena?',
    options: ['Que hacía buen tiempo', 'Que el tiempo era horrible', 'Que Elena no debía salir', 'Que él tenía paraguas'],
    correctIndex: 1 },
  { order: 3, taskType: 'irony',
    story: 'Rubén llega dos horas tarde a la cita. Su amigo lo recibe diciendo: "¡Llegas muy puntual, como siempre!"',
    question: '¿Qué expresaba realmente el amigo de Rubén?',
    options: ['Que Rubén es muy puntual', 'Una crítica irónica por el retraso', 'Que no le importa la hora', 'Que él también llega tarde siempre'],
    correctIndex: 1 },
];

interface LevelParams { count: number; maxOrder: ToMOrder; allowTaskTypes: ToMTaskType[]; timePerScenario: number }
const LEVELS: LevelParams[] = [
  { count: 2, maxOrder: 1, allowTaskTypes: ['belief'],                  timePerScenario: 20000 },
  { count: 3, maxOrder: 1, allowTaskTypes: ['belief'],                  timePerScenario: 18000 },
  { count: 3, maxOrder: 2, allowTaskTypes: ['belief', 'faux_pas'],      timePerScenario: 22000 },
  { count: 4, maxOrder: 2, allowTaskTypes: ['belief', 'faux_pas'],      timePerScenario: 22000 },
  { count: 4, maxOrder: 3, allowTaskTypes: ['belief', 'faux_pas', 'irony'], timePerScenario: 25000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<TheoryOfMindStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const eligible = SCENARIO_BANK.filter(s => s.order <= p.maxOrder && p.allowTaskTypes.includes(s.taskType));
  const selected = shuffle(eligible, rng).slice(0, p.count);
  const scenarios: ToMScenario[] = selected.map((s, idx) => ({ id: idx, ...s }));
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerScenario) / 1000), stimuli: { scenarios, timePerScenario: p.timePerScenario } };
}

export function summarize(stimuli: TheoryOfMindStimuli, response: TheoryOfMindResponse): ExerciseSummary {
  const map = new Map(stimuli.scenarios.map(s => [s.id, s.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.scenarioId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
