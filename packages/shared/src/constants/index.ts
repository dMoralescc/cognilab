export const COGNITIVE_AREAS = [
  'ATTENTION',
  'MEMORY',
  'EXECUTIVE_FUNCTIONS',
  'LANGUAGE',
  'VISUOSPATIAL',
  'ORIENTATION',
  'SOCIAL_COGNITION',
] as const;

export const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5] as const;

export const COGNITIVE_AREA_LABELS: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Funciones Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cognición Social',
};
