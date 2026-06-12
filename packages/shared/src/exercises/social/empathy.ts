import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface EmpathyScenario {
  id: number;
  situation: string;
  personEmotion: string;
  options: string[];
  correctIndex: number;  // most empathic response
}

export interface EmpathyStimuli {
  scenarios: EmpathyScenario[];
  timePerScenario: number;
}

export interface EmpathyTrialResponse {
  scenarioId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type EmpathyResponse = EmpathyTrialResponse[];

const SCENARIO_BANK: Omit<EmpathyScenario, 'id'>[] = [
  { situation: 'Tu amigo te dice que acaba de perder su trabajo.', personEmotion: 'angustia y preocupación',
    options: ['Lo siento mucho. ¿Cómo te encuentras?', 'Buf, peor estaba yo cuando me pasó a mí.', 'Ya encontrarás otro, no es para tanto.', 'Pues menuda suerte has tenido.'],
    correctIndex: 0 },
  { situation: 'Una compañera llora porque suspendió un examen importante.', personEmotion: 'frustración y tristeza',
    options: ['Tenías que haber estudiado más.', 'Entiendo que estés triste. ¿Quieres hablar?', 'A mí también me fue mal una vez.', 'Tampoco es para llorar.'],
    correctIndex: 1 },
  { situation: 'Un familiar mayor confiesa que se siente solo y olvidado.', personEmotion: 'soledad y tristeza',
    options: ['Ya llamaremos más a menudo.', 'Tú siempre quejándote.', 'Eso me entristece mucho escucharlo. ¿Puedo hacer algo por ti?', 'Es que todos estamos muy ocupados.'],
    correctIndex: 2 },
  { situation: 'Un compañero te dice que tiene miedo de la cirugía que le van a hacer.', personEmotion: 'miedo e incertidumbre',
    options: ['Es normal tener miedo. Estoy aquí si necesitas hablar.', 'No es para tanto, es una operación sencilla.', 'Yo tuve una y no me dolió nada.', 'No pienses en eso.'],
    correctIndex: 0 },
  { situation: 'Tu amiga está muy emocionada porque acaba de nacer su primer hijo.', personEmotion: 'alegría y emoción',
    options: ['Menos mal, ya era hora.', '¡Qué alegría tan grande! ¡Enhorabuena!', 'Pues ahora ya no podrás salir como antes.', 'Espero que no llore mucho.'],
    correctIndex: 1 },
  { situation: 'Un vecino te cuenta que su pareja le dejó de repente.', personEmotion: 'dolor y confusión',
    options: ['Seguro que tú tuviste la culpa.', 'Vaya, ya encontrarás a alguien mejor.', 'Eso debe ser muy doloroso. ¿Estás bien?', 'Mejor así, no te convenía.'],
    correctIndex: 2 },
  { situation: 'Un estudiante comparte que fue víctima de acoso escolar.', personEmotion: 'vergüenza y miedo',
    options: ['Lo que me cuentas es muy serio. Te escucho y quiero ayudarte.', 'Algo habrás hecho tú también.', 'Con ignorarles se soluciona.', 'Todos pasamos por eso.'],
    correctIndex: 0 },
  { situation: 'Un colega se queja de que nadie valora su trabajo en la empresa.', personEmotion: 'frustración y desmotivación',
    options: ['Quizás no trabajas lo suficiente.', 'Parece que eso te duele mucho. ¿Qué ha pasado exactamente?', 'A todos nos pasa lo mismo.', 'Cambia de trabajo si no te gusta.'],
    correctIndex: 1 },
];

interface LevelParams { count: number; timePerScenario: number }
const LEVELS: LevelParams[] = [
  { count: 3, timePerScenario: 15000 },
  { count: 4, timePerScenario: 15000 },
  { count: 5, timePerScenario: 18000 },
  { count: 6, timePerScenario: 18000 },
  { count: 8, timePerScenario: 20000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<EmpathyStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const selected = shuffle(SCENARIO_BANK, rng).slice(0, p.count);
  const scenarios: EmpathyScenario[] = selected.map((s, idx) => ({ id: idx, ...s }));
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerScenario) / 1000), stimuli: { scenarios, timePerScenario: p.timePerScenario } };
}

export function summarize(stimuli: EmpathyStimuli, response: EmpathyResponse): ExerciseSummary {
  const map = new Map(stimuli.scenarios.map(s => [s.id, s.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.scenarioId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
