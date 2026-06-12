import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface MoralDilemma {
  id: number;
  scenario: string;
  action: string;
  question: string;
  options: string[];
  correctIndex: number;
  reasoning: string;  // shown as feedback
}

export interface MoralCognitionStimuli {
  dilemmas: MoralDilemma[];
  timePerDilemma: number;
}

export interface MoralTrialResponse {
  dilemmaId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type MoralCognitionResponse = MoralTrialResponse[];

const DILEMMA_BANK: Omit<MoralDilemma, 'id'>[] = [
  { scenario: 'Ves que un niño tira basura al suelo en el parque sin que nadie lo vea.',
    action: 'No decir nada para no molestar.',
    question: '¿Es apropiada esta acción?',
    options: ['Sí, es mejor no meterse', 'No, sería mejor decirle respetuosamente que recoja la basura', 'Sí, el niño es pequeño', 'No importa, hay basureros'],
    correctIndex: 1,
    reasoning: 'Intervenir de manera respetuosa promueve valores cívicos sin ser agresivo.' },
  { scenario: 'Te dan demasiado cambio en una tienda por error.',
    action: 'Quedarte con el dinero extra sin decir nada.',
    question: '¿Es moralmente correcto quedarse el dinero?',
    options: ['Sí, fue error suyo', 'No, lo correcto es devolver el dinero extra', 'Sí, si nadie lo nota', 'Depende de la cantidad'],
    correctIndex: 1,
    reasoning: 'Devolver el cambio incorrecto es lo que dicta la honestidad, independientemente del importe.' },
  { scenario: 'Un colega cuenta un chiste que ofende a otros compañeros.',
    action: 'Reírse para no quedar mal.',
    question: '¿Cuál sería la respuesta más adecuada?',
    options: ['Reírse, no hay que ser tan sensibles', 'Ignorarlo y no decir nada', 'Decir con calma que ese tipo de chistes no es apropiado', 'Abandonar la sala sin explicación'],
    correctIndex: 2,
    reasoning: 'Expresar el desacuerdo con respeto es la acción más constructiva.' },
  { scenario: 'Sabes que un amigo ha hecho algo que puede perjudicar a otros sin saberlo.',
    action: 'No decirle nada para no crear conflicto.',
    question: '¿Es correcto callarse para evitar el conflicto?',
    options: ['Sí, los conflictos son negativos siempre', 'No, lo responsable es informarle del posible daño', 'Depende de cuánto le afecte a otros', 'Sí, si total ya está hecho'],
    correctIndex: 1,
    reasoning: 'Informar a alguien del daño potencial que puede causar es un acto de responsabilidad y cuidado.' },
  { scenario: 'Tienes información importante que un compañero necesita, pero compartirla te perjudicará a ti.',
    action: 'Ocultar la información.',
    question: '¿Es justificable ocultar la información?',
    options: ['Sí, tienes derecho a protegerte', 'No siempre; depende de cuánto daño cause la omisión', 'Sí, nadie te puede obligar', 'No, nunca se puede ocultar información'],
    correctIndex: 1,
    reasoning: 'La justificación moral de protegerse depende del impacto de la omisión en los demás.' },
  { scenario: 'Presencias que alguien está siendo tratado injustamente en una cola de espera.',
    action: 'No intervenir porque no es asunto tuyo.',
    question: '¿Cuál es la respuesta más apropiada?',
    options: ['No intervenir, no es tu problema', 'Intervenir o alertar al responsable del lugar si hay injusticia clara', 'Intervenir siempre de manera directa y enérgica', 'Solo intervenir si conoces a la persona'],
    correctIndex: 1,
    reasoning: 'Intervenir de forma proporcionada ante una injusticia clara es parte de la responsabilidad social.' },
];

interface LevelParams { count: number; timePerDilemma: number }
const LEVELS: LevelParams[] = [
  { count: 2, timePerDilemma: 20000 },
  { count: 3, timePerDilemma: 20000 },
  { count: 4, timePerDilemma: 22000 },
  { count: 5, timePerDilemma: 22000 },
  { count: 6, timePerDilemma: 25000 },
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

export function generate(level: number, seed: number): ExerciseContent<MoralCognitionStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const rng = seededRandom(seed);
  const selected = shuffle(DILEMMA_BANK, rng).slice(0, p.count);
  const dilemmas: MoralDilemma[] = selected.map((d, idx) => ({ id: idx, ...d }));
  return { level, seed, timeLimit: Math.ceil((p.count * p.timePerDilemma) / 1000), stimuli: { dilemmas, timePerDilemma: p.timePerDilemma } };
}

export function summarize(stimuli: MoralCognitionStimuli, response: MoralCognitionResponse): ExerciseSummary {
  const map = new Map(stimuli.dilemmas.map(d => [d.id, d.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.dilemmaId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
