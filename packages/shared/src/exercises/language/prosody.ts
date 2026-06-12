import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export type Emotion = 'alegría' | 'tristeza' | 'enfado' | 'miedo' | 'sorpresa' | 'disgusto' | 'sarcasmo' | 'indiferencia';

export interface ProsodyItem {
  id: number;
  sentence: string;
  context: string | null;
  emotion: Emotion;
  options: Emotion[];
}

export interface ProsodyStimuli {
  items: ProsodyItem[];
  timePerItem: number;
}

export interface ProsodyTrialResponse {
  itemId: number;
  chosenEmotion: Emotion;
  reactionTimeMs: number;
}

export type ProsodyResponse = ProsodyTrialResponse[];

interface ProsodyRaw { sentence: string; context: string | null; emotion: Emotion }

const BANK: ProsodyRaw[][] = [
  // Level 1 — basic emotions, obvious expression
  [
    { sentence: '¡Qué regalo tan bonito, me encanta!', context: null, emotion: 'alegría' },
    { sentence: 'Se fue mi perro y no volverá...', context: null, emotion: 'tristeza' },
    { sentence: '¡No me toques eso, es mío!', context: null, emotion: 'enfado' },
    { sentence: '¿Qué fue ese ruido? ¿Hay alguien ahí?', context: null, emotion: 'miedo' },
    { sentence: '¡Pero si es tu cumpleaños hoy!', context: null, emotion: 'sorpresa' },
  ],
  // Level 2
  [
    { sentence: 'Por fin terminamos, me alegro mucho.', context: null, emotion: 'alegría' },
    { sentence: 'Nadie me avisó y me quedé solo.', context: null, emotion: 'tristeza' },
    { sentence: 'Te he dicho mil veces que no hagas eso.', context: null, emotion: 'enfado' },
    { sentence: 'No sé qué va a pasar mañana.', context: null, emotion: 'miedo' },
    { sentence: 'Esto sabe horrible, no lo puedo comer.', context: null, emotion: 'disgusto' },
  ],
  // Level 3
  [
    { sentence: 'Claro, lo que tú digas...', context: 'Dicho después de perder un debate.', emotion: 'sarcasmo' },
    { sentence: 'Ah, ya veo. Bueno.', context: null, emotion: 'indiferencia' },
    { sentence: 'Sí, fenomenal, como siempre...', context: 'Dicho tras enterarse de una mala noticia por tercera vez.', emotion: 'sarcasmo' },
    { sentence: 'Lo que haga falta.', context: null, emotion: 'indiferencia' },
    { sentence: 'Genial, otro lunes más.', context: 'Dicho por alguien que no le gustan los lunes.', emotion: 'sarcasmo' },
  ],
  // Level 4
  [
    { sentence: 'No me importa lo que piensen.', context: 'Dicho con voz temblorosa justo antes de entrar a un examen.', emotion: 'miedo' },
    { sentence: 'Claro, muy bien, muy bien.', context: 'Respuesta al escuchar que su propuesta fue rechazada.', emotion: 'sarcasmo' },
    { sentence: 'Gracias, muy amable.', context: 'Dicho tras recibir una crítica pública.', emotion: 'disgusto' },
    { sentence: 'Sí, me parece perfecto.', context: 'Dicho con tono plano sin mirar al interlocutor.', emotion: 'indiferencia' },
    { sentence: 'Ah, pero si ya lo sabía yo.', context: null, emotion: 'sorpresa' },
  ],
  // Level 5 — subtle, ambiguous context
  [
    { sentence: 'Qué interesante.', context: 'Dicho durante una presentación que ya dura dos horas.', emotion: 'sarcasmo' },
    { sentence: 'Espero que todo vaya bien.', context: 'Dicho antes de conocer el resultado de una biopsia.', emotion: 'miedo' },
    { sentence: 'Bueno, tampoco es para tanto.', context: 'Dicho tras un error propio que causó un problema serio.', emotion: 'sarcasmo' },
    { sentence: 'Da igual, lo que quieras tú.', context: 'Dicho tras una larga discusión sobre adónde ir a cenar.', emotion: 'enfado' },
    { sentence: 'No, si ya me lo imaginaba.', context: null, emotion: 'tristeza' },
  ],
];

const EMOTION_SETS: Emotion[][] = [
  ['alegría', 'tristeza', 'enfado', 'miedo'],
  ['alegría', 'tristeza', 'enfado', 'disgusto'],
  ['sarcasmo', 'indiferencia', 'alegría', 'enfado'],
  ['miedo', 'sarcasmo', 'disgusto', 'indiferencia'],
  ['sarcasmo', 'miedo', 'tristeza', 'enfado'],
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

const TIME_PER_ITEM = [10000, 12000, 14000, 16000, 20000];

export function generate(level: number, seed: number): ExerciseContent<ProsodyStimuli> {
  const rng = seededRandom(seed);
  const bank = BANK[(level - 1)] ?? BANK[0]!;
  const emotionSet = EMOTION_SETS[(level - 1)] ?? EMOTION_SETS[0]!;
  const timePerItem = TIME_PER_ITEM[(level - 1)] ?? 12000;
  const raw = shuffle(bank, rng);
  const items: ProsodyItem[] = raw.map((r, idx) => {
    const opts = shuffle([...emotionSet], rng);
    if (!opts.includes(r.emotion)) { opts[0] = r.emotion; }
    return { id: idx, sentence: r.sentence, context: r.context, emotion: r.emotion, options: opts };
  });
  return { level, seed, timeLimit: Math.ceil((items.length * timePerItem) / 1000), stimuli: { items, timePerItem } };
}

export function summarize(stimuli: ProsodyStimuli, response: ProsodyResponse): ExerciseSummary {
  const emotionMap = new Map(stimuli.items.map(it => [it.id, it.emotion]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenEmotion === emotionMap.get(r.itemId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
