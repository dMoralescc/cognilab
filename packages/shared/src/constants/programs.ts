export interface ProgramExercise {
  slug: string;
  level: number;
}

export interface CognitiveProgramTemplate {
  id: string;
  name: string;
  pathology: string;
  description: string;
  icon: string;
  exercises: ProgramExercise[];
}

export const COGNITIVE_PROGRAMS: CognitiveProgramTemplate[] = [
  {
    id: 'stroke',
    name: 'Rehabilitación post-ictus',
    pathology: 'Ictus / ACV',
    description: 'Protocolo para recuperación de atención, memoria y funciones ejecutivas tras un accidente cerebrovascular.',
    icon: '🫀',
    exercises: [
      { slug: 'cancellation',          level: 1 },
      { slug: 'visual_search',         level: 1 },
      { slug: 'go_no_go',              level: 1 },
      { slug: 'digit_span',            level: 1 },
      { slug: 'position_sequences',    level: 1 },
      { slug: 'trail_making',          level: 1 },
      { slug: 'stroop',                level: 1 },
      { slug: 'naming',                level: 1 },
      { slug: 'figure_copy',           level: 1 },
      { slug: 'temporal_orientation',  level: 1 },
    ],
  },
  {
    id: 'alzheimer',
    name: 'Estimulación cognitiva — Alzheimer',
    pathology: 'Alzheimer / Demencia',
    description: 'Programa de estimulación multiárea con énfasis en orientación, memoria episódica y lenguaje para personas con Alzheimer leve-moderado.',
    icon: '🧩',
    exercises: [
      { slug: 'temporal_orientation',  level: 1 },
      { slug: 'spatial_orientation',   level: 1 },
      { slug: 'personal_orientation',  level: 1 },
      { slug: 'word_memory',           level: 1 },
      { slug: 'face_memory',           level: 1 },
      { slug: 'semantic_memory',       level: 1 },
      { slug: 'naming',                level: 1 },
      { slug: 'categorization',        level: 1 },
      { slug: 'emotion_recognition',   level: 1 },
      { slug: 'attention_span',        level: 1 },
    ],
  },
  {
    id: 'adhd',
    name: 'Atención y control ejecutivo — TDAH',
    pathology: 'TDAH',
    description: 'Ejercicios de atención sostenida, inhibición y flexibilidad cognitiva para adultos y adolescentes con TDAH.',
    icon: '⚡',
    exercises: [
      { slug: 'go_no_go',              level: 2 },
      { slug: 'vigilance',             level: 2 },
      { slug: 'inhibition',            level: 2 },
      { slug: 'n_back',                level: 1 },
      { slug: 'stroop',                level: 2 },
      { slug: 'cognitive_flexibility', level: 2 },
      { slug: 'alternating_attention', level: 2 },
      { slug: 'divided_attention',     level: 1 },
      { slug: 'reaction_time',         level: 2 },
      { slug: 'trail_making',          level: 2 },
    ],
  },
  {
    id: 'tbi',
    name: 'Daño cerebral adquirido',
    pathology: 'Traumatismo craneoencefálico',
    description: 'Protocolo integral de neurorrehabilitación para TCE: atención, memoria, funciones ejecutivas y habilidades visoespaciales.',
    icon: '🛡️',
    exercises: [
      { slug: 'reaction_time',         level: 1 },
      { slug: 'attention_span',        level: 1 },
      { slug: 'digit_span',            level: 1 },
      { slug: 'visual_recognition',    level: 1 },
      { slug: 'trail_making',          level: 1 },
      { slug: 'tower_of_hanoi',        level: 1 },
      { slug: 'stroop',                level: 1 },
      { slug: 'figure_copy',           level: 1 },
      { slug: 'maze',                  level: 1 },
      { slug: 'problem_solving',       level: 1 },
    ],
  },
  {
    id: 'parkinson',
    name: 'Estimulación cognitiva — Parkinson',
    pathology: 'Enfermedad de Parkinson',
    description: 'Programa adaptado para pacientes con Parkinson, con foco en velocidad de procesamiento, atención y funciones ejecutivas.',
    icon: '🤲',
    exercises: [
      { slug: 'reaction_time',         level: 1 },
      { slug: 'go_no_go',              level: 1 },
      { slug: 'visual_search',         level: 1 },
      { slug: 'digit_span',            level: 2 },
      { slug: 'semantic_memory',       level: 2 },
      { slug: 'phonological_fluency',  level: 1 },
      { slug: 'semantic_fluency',      level: 1 },
      { slug: 'cognitive_flexibility', level: 1 },
      { slug: 'abstract_reasoning',    level: 1 },
      { slug: 'episodic_memory',       level: 1 },
    ],
  },
  {
    id: 'ms',
    name: 'Esclerosis múltiple',
    pathology: 'Esclerosis múltiple',
    description: 'Ejercicios de memoria de trabajo, atención y procesamiento de la información para personas con esclerosis múltiple.',
    icon: '🔗',
    exercises: [
      { slug: 'divided_attention',      level: 1 },
      { slug: 'n_back',                 level: 1 },
      { slug: 'spatial_working_memory', level: 1 },
      { slug: 'visuospatial_span',      level: 1 },
      { slug: 'word_memory',            level: 2 },
      { slug: 'prospective_memory',     level: 1 },
      { slug: 'dual_task',              level: 1 },
      { slug: 'cognitive_flexibility',  level: 1 },
      { slug: 'line_orientation',       level: 1 },
      { slug: 'mental_rotation',        level: 1 },
    ],
  },
];
