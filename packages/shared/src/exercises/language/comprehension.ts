import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface ComprehensionItem {
  id: number;
  stimulus: string;
  taskType: 'command' | 'question';
  options: string[];
  correctIndex: number;
}

export interface ComprehensionStimuli {
  items: ComprehensionItem[];
  timePerItem: number;
}

export interface ComprehensionTrialResponse {
  itemId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type ComprehensionResponse = ComprehensionTrialResponse[];

interface ComprehensionRaw { stimulus: string; taskType: 'command' | 'question'; options: string[]; correctIndex: number }

const ITEM_BANK: ComprehensionRaw[][] = [
  // Level 1 — simple 1-step commands / straightforward questions
  [
    { stimulus: 'Señala algo que se use para escribir.', taskType: 'command', options: ['lápiz', 'silla', 'ventana', 'puerta'], correctIndex: 0 },
    { stimulus: '¿Qué animal hace "miau"?', taskType: 'question', options: ['perro', 'gato', 'pájaro', 'vaca'], correctIndex: 1 },
    { stimulus: 'Señala el objeto que sirve para ver la hora.', taskType: 'command', options: ['libro', 'reloj', 'espejo', 'cuadro'], correctIndex: 1 },
    { stimulus: '¿Con qué se corta el pan?', taskType: 'question', options: ['tenedor', 'cuchara', 'cuchillo', 'palillo'], correctIndex: 2 },
    { stimulus: 'Señala lo que se usa para abrir una puerta.', taskType: 'command', options: ['moneda', 'llave', 'bolígrafo', 'piedra'], correctIndex: 1 },
  ],
  // Level 2
  [
    { stimulus: 'Si tienes frío, ¿qué te pones?', taskType: 'question', options: ['bañador', 'chaqueta', 'sandalias', 'gafas de sol'], correctIndex: 1 },
    { stimulus: 'Señala lo que harías primero si quieres hacer una llamada.', taskType: 'command', options: ['hablar', 'colgar', 'marcar el número', 'apagar el teléfono'], correctIndex: 2 },
    { stimulus: '¿Qué necesitas para escribir una carta?', taskType: 'question', options: ['martillo', 'papel y bolígrafo', 'sartén', 'escalera'], correctIndex: 1 },
    { stimulus: 'Si el semáforo está en rojo, ¿qué debes hacer?', taskType: 'question', options: ['acelerar', 'girar', 'parar', 'tocar el claxon'], correctIndex: 2 },
    { stimulus: 'Señala la acción correcta al cruzar la calle.', taskType: 'command', options: ['mirar a ambos lados', 'correr sin mirar', 'cerrar los ojos', 'ir marcha atrás'], correctIndex: 0 },
  ],
  // Level 3
  [
    { stimulus: 'Pedro fue al mercado, compró manzanas y luego volvió a casa. ¿Adónde fue Pedro?', taskType: 'question', options: ['a la farmacia', 'al mercado', 'al parque', 'al banco'], correctIndex: 1 },
    { stimulus: 'Antes de salir de casa por la mañana, Ana se ducha, desayuna y se viste. ¿Qué hace Ana después de ducharse?', taskType: 'question', options: ['se viste', 'sale de casa', 'desayuna', 'se lava los dientes'], correctIndex: 2 },
    { stimulus: 'La caja está encima de la mesa y la silla está debajo de la mesa. ¿Dónde está la caja?', taskType: 'question', options: ['debajo de la mesa', 'encima de la mesa', 'al lado de la silla', 'dentro del cajón'], correctIndex: 1 },
    { stimulus: '¿Qué harías si encontraras una cartera en la calle con documentos dentro?', taskType: 'question', options: ['quedármela', 'tirarla', 'llevarla a la policía', 'dejarla donde está'], correctIndex: 2 },
    { stimulus: 'Señala la opción que indica el paso correcto para preparar un café.', taskType: 'command', options: ['poner el café, añadir agua fría y beber', 'calentar agua, añadir café y servir', 'mezclar leche fría y azúcar', 'hervir el café en leche con sal'], correctIndex: 1 },
  ],
  // Level 4
  [
    { stimulus: 'María es más alta que Ana, pero más baja que Lucía. ¿Quién es la más alta?', taskType: 'question', options: ['María', 'Ana', 'Lucía', 'Son iguales'], correctIndex: 2 },
    { stimulus: 'Si A ocurre antes que B, y B ocurre antes que C, ¿qué ocurre primero?', taskType: 'question', options: ['B', 'C', 'A', 'Todos a la vez'], correctIndex: 2 },
    { stimulus: 'El libro que me prestaste, que era de tu hermana, lo dejé en la mesa del salón. ¿Dónde está el libro?', taskType: 'question', options: ['en la habitación', 'en la cocina', 'en la mesa del salón', 'en la biblioteca'], correctIndex: 2 },
    { stimulus: 'Aunque llovía, salieron a pasear porque llevaban paraguas. ¿Por qué salieron a pasear?', taskType: 'question', options: ['porque hizo sol', 'porque llevaban paraguas', 'porque se aburrían', 'porque era obligatorio'], correctIndex: 1 },
    { stimulus: 'Señala la inferencia correcta: "Carmen entró en casa empapada."', taskType: 'command', options: ['Carmen había estado nadando', 'Probablemente llovía o había agua fuera', 'Carmen había derramado agua', 'Carmen llevaba ropa mojada de antes'], correctIndex: 1 },
  ],
  // Level 5
  [
    { stimulus: 'Si todos los perros son animales y algunos animales vuelan, ¿podemos afirmar que algunos perros vuelan?', taskType: 'question', options: ['Sí, siempre', 'No necesariamente', 'Sí, si son pequeños', 'Solo en casos especiales'], correctIndex: 1 },
    { stimulus: '"Aunque Juan sabía que era arriesgado, decidió continuar, ya que las consecuencias de no hacerlo serían peores." ¿Por qué continuó Juan?', taskType: 'question', options: ['porque no sabía el riesgo', 'porque le gustaba el riesgo', 'porque parar tendría peores consecuencias', 'porque alguien se lo pidió'], correctIndex: 2 },
    { stimulus: 'El médico dijo: "Si mejora en 48 horas, puede salir. De lo contrario, habrá que hacer más pruebas." Han pasado 48 horas y el paciente no ha mejorado. ¿Qué ocurrirá?', taskType: 'question', options: ['saldrá del hospital', 'se harán más pruebas', 'le darán el alta', 'no pasará nada'], correctIndex: 1 },
    { stimulus: '"La propuesta fue rechazada por los miembros del comité que no habían asistido a la reunión previa." ¿Quién rechazó la propuesta?', taskType: 'question', options: ['todos los miembros', 'los que no asistieron a la reunión previa', 'los que sí asistieron', 'nadie'], correctIndex: 1 },
    { stimulus: 'Señala la conclusión más lógica: "Cada vez que llueve, la calle se moja. Hoy la calle está mojada."', taskType: 'command', options: ['Necesariamente llovió', 'Posiblemente llovió, pero puede haber otra causa', 'No llovió', 'Siempre llueve en esta ciudad'], correctIndex: 1 },
  ],
];

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i] as T; a[i] = a[j] as T; a[j] = tmp;
  }
  return a;
}

const TIME_PER_ITEM = [12000, 14000, 18000, 22000, 28000];

export function generate(level: number, seed: number): ExerciseContent<ComprehensionStimuli> {
  const rng = seededRandom(seed);
  const bank = ITEM_BANK[(level - 1)] ?? ITEM_BANK[0]!;
  const timePerItem = TIME_PER_ITEM[(level - 1)] ?? 15000;
  const raw = shuffle(bank, rng);
  const items: ComprehensionItem[] = raw.map((r, idx) => ({ id: idx, ...r }));
  return { level, seed, timeLimit: Math.ceil((items.length * timePerItem) / 1000), stimuli: { items, timePerItem } };
}

export function summarize(stimuli: ComprehensionStimuli, response: ComprehensionResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.items.map(it => [it.id, it.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === correctMap.get(r.itemId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
