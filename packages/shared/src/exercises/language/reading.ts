import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';
import { seededRandom } from '../../utils/random';

export interface ReadingQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  isInferential: boolean;
}

export interface ReadingStimuli {
  text: string;
  title: string;
  questions: ReadingQuestion[];
  readingTimeLimit: number;  // seconds to read before questions appear
}

export interface ReadingTrialResponse {
  questionId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type ReadingResponse = ReadingTrialResponse[];

interface ReadingPassage {
  title: string;
  text: string;
  questions: Omit<ReadingQuestion, 'id'>[];
}

const PASSAGES: ReadingPassage[][] = [
  // Level 1 — very short, high-frequency vocab, literal questions
  [{
    title: 'El perro de Luis',
    text: 'Luis tiene un perro llamado Max. Max es grande y marrón. Le gusta correr en el parque. Todos los días Luis lo saca a pasear por la mañana.',
    questions: [
      { question: '¿Cómo se llama el perro de Luis?', options: ['Rex', 'Max', 'Bob', 'Tom'], correctIndex: 1, isInferential: false },
      { question: '¿De qué color es el perro?', options: ['negro', 'blanco', 'marrón', 'gris'], correctIndex: 2, isInferential: false },
      { question: '¿Cuándo saca Luis al perro?', options: ['por la tarde', 'por la noche', 'por la mañana', 'al mediodía'], correctIndex: 2, isInferential: false },
    ],
  }],
  // Level 2
  [{
    title: 'La panadería del barrio',
    text: 'En la calle Mayor hay una panadería llamada "El horno de Ana". Ana abre la tienda a las 7 de la mañana y cierra a las 2 del mediodía. Cada día hace pan de varios tipos: baguette, de centeno y pan de molde. Los vecinos del barrio la conocen muy bien porque siempre les guarda el pan preferido.',
    questions: [
      { question: '¿Cómo se llama la panadería?', options: ['El rincón del pan', 'La baguette dorada', 'El horno de Ana', 'Pan y más'], correctIndex: 2, isInferential: false },
      { question: '¿A qué hora abre Ana la tienda?', options: ['a las 6', 'a las 7', 'a las 8', 'a las 9'], correctIndex: 1, isInferential: false },
      { question: '¿Por qué los vecinos la conocen bien?', options: ['porque es muy antigua', 'porque les guarda el pan preferido', 'porque es barata', 'porque está en el centro'], correctIndex: 1, isInferential: false },
    ],
  }],
  // Level 3
  [{
    title: 'El vuelo retrasado',
    text: 'Elena llegó al aeropuerto con dos horas de antelación, como recomiendan las compañías. Sin embargo, cuando consultó el panel de información, vio que su vuelo tenía un retraso de tres horas por problemas técnicos en la aeronave. Decidió llamar a su familia para avisarles y, mientras esperaba, aprovechó para leer el libro que llevaba en la mochila. A pesar del contratiempo, llegó a su destino aquella misma tarde.',
    questions: [
      { question: '¿Con cuánta antelación llegó Elena al aeropuerto?', options: ['una hora', 'dos horas', 'tres horas', 'cuatro horas'], correctIndex: 1, isInferential: false },
      { question: '¿Cuál fue la causa del retraso?', options: ['mal tiempo', 'huelga de pilotos', 'problemas técnicos en la aeronave', 'overbooking'], correctIndex: 2, isInferential: false },
      { question: '¿Qué hizo Elena mientras esperaba?', options: ['durmió', 'comió en un restaurante', 'trabajó con el ordenador', 'leyó un libro'], correctIndex: 3, isInferential: false },
      { question: '¿Llegó Elena a su destino ese día?', options: ['sí, aquella tarde', 'no, al día siguiente', 'sí, por la mañana', 'no, cancelaron el vuelo'], correctIndex: 0, isInferential: false },
    ],
  }],
  // Level 4 — inferential questions
  [{
    title: 'El proyecto de renovación',
    text: 'El ayuntamiento anunció un proyecto de renovación del parque central que incluiría nuevas zonas de juego, más bancos y una mejora del sistema de riego. Los vecinos de la zona aplaudieron la iniciativa, aunque algunos señalaron que ya habían reclamado estas mejoras durante varios años. La concejala de medio ambiente destacó que la inversión respondía a las demandas ciudadanas y que las obras comenzarían el próximo otoño. Sin embargo, una asociación ecologista mostró su preocupación por la tala de algunos árboles viejos para ampliar las zonas de paso.',
    questions: [
      { question: '¿Qué incluirá el proyecto de renovación?', options: ['solo bancos nuevos', 'zonas de juego, bancos y mejora del riego', 'un nuevo carril bici', 'iluminación nocturna'], correctIndex: 1, isInferential: false },
      { question: '¿Por qué algunos vecinos señalaron que llevaban años reclamando mejoras?', options: ['porque el parque es nuevo', 'porque las mejoras llegaron tarde', 'porque querían más dinero', 'porque no les gustaba la idea'], correctIndex: 1, isInferential: true },
      { question: '¿Qué podemos inferir de la posición de la asociación ecologista?', options: ['apoyan completamente el proyecto', 'solo les preocupa el coste', 'anteponen la conservación de árboles al paso peatonal', 'rechazan cualquier renovación'], correctIndex: 2, isInferential: true },
      { question: '¿Cuándo comenzarían las obras?', options: ['en primavera', 'en verano', 'en otoño', 'en invierno'], correctIndex: 2, isInferential: false },
    ],
  }],
  // Level 5 — specialized vocabulary, complex inference
  [{
    title: 'La plasticidad neuronal',
    text: 'La neuroplasticidad es la capacidad del sistema nervioso para reorganizarse y adaptarse a nuevas situaciones mediante la formación de nuevas conexiones sinápticas. Esta propiedad, presente a lo largo de toda la vida aunque con mayor intensidad durante la infancia, es la base de procesos como el aprendizaje, la memoria y la recuperación tras lesiones cerebrales. Estudios recientes han demostrado que actividades como el ejercicio aeróbico, el aprendizaje de un segundo idioma y la práctica musical favorecen de forma significativa la neuroplasticidad en adultos mayores, retrasando el deterioro cognitivo asociado al envejecimiento.',
    questions: [
      { question: '¿Qué es la neuroplasticidad?', options: ['la rigidez del sistema nervioso', 'la capacidad del sistema nervioso para reorganizarse', 'una enfermedad neurológica', 'un tipo de cirugía cerebral'], correctIndex: 1, isInferential: false },
      { question: '¿En qué etapa de la vida es mayor la neuroplasticidad?', options: ['en la vejez', 'en la adultez', 'durante la infancia', 'en la adolescencia'], correctIndex: 2, isInferential: false },
      { question: '¿Qué podemos inferir sobre el aprendizaje de idiomas en mayores?', options: ['no tiene ningún efecto', 'es perjudicial para el cerebro', 'puede contribuir a mantener la función cognitiva', 'solo beneficia a los jóvenes'], correctIndex: 2, isInferential: true },
      { question: '¿Cuál sería la conclusión más apropiada del texto?', options: ['la neuroplasticidad solo importa en lesiones cerebrales', 'llevar un estilo de vida activo puede proteger el cerebro del envejecimiento', 'el deterioro cognitivo es inevitable', 'solo el ejercicio físico mejora la neuroplasticidad'], correctIndex: 1, isInferential: true },
    ],
  }],
];

const READING_TIMES = [30, 45, 60, 90, 120];

export function generate(level: number, seed: number): ExerciseContent<ReadingStimuli> {
  const rng = seededRandom(seed);
  void rng;
  const passages = PASSAGES[(level - 1)] ?? PASSAGES[0]!;
  const passage = passages[0]!;
  const readingTimeLimit = READING_TIMES[(level - 1)] ?? 60;
  const questions: ReadingQuestion[] = passage.questions.map((q, idx) => ({ id: idx, ...q }));
  const totalTime = readingTimeLimit + questions.length * 30;
  return { level, seed, timeLimit: totalTime, stimuli: { text: passage.text, title: passage.title, questions, readingTimeLimit } };
}

export function summarize(stimuli: ReadingStimuli, response: ReadingResponse): ExerciseSummary {
  const correctMap = new Map(stimuli.questions.map(q => [q.id, q.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === correctMap.get(r.questionId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
