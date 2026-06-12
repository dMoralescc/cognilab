import type { ExerciseContent, ExerciseSummary } from '../../types/exercise';

export type PersonalCategory = 'name' | 'age' | 'birthYear' | 'profession' | 'familyMember' | 'biographicDetail';

export interface PatientProfile {
  name: string;
  age: number;
  birthYear: number;
  profession: string;
  familyMember: string;
  biographicDetail: string;
}

export interface PersonalQuestion {
  id: number;
  category: PersonalCategory;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PersonalOrientationStimuli {
  questions: PersonalQuestion[];
  patientProfile: PatientProfile;
}

export interface PersonalTrialResponse {
  questionId: number;
  chosenIndex: number;
  reactionTimeMs: number;
}

export type PersonalOrientationResponse = PersonalTrialResponse[];

const DEFAULT_PROFILE: PatientProfile = {
  name: 'Juan García',
  age: 68,
  birthYear: 1956,
  profession: 'Maestro',
  familyMember: 'María (esposa)',
  biographicDetail: 'Vivió en Valencia durante 30 años',
};

interface LevelParams { categories: PersonalCategory[] }
const LEVELS: LevelParams[] = [
  { categories: ['name', 'age'] },
  { categories: ['name', 'age', 'birthYear'] },
  { categories: ['name', 'age', 'profession', 'familyMember'] },
  { categories: ['name', 'age', 'birthYear', 'profession', 'familyMember'] },
  { categories: ['name', 'age', 'birthYear', 'profession', 'familyMember', 'biographicDetail'] },
];

function buildQn(category: PersonalCategory, profile: PatientProfile, id: number): PersonalQuestion {
  switch (category) {
    case 'name': return {
      id, category, question: '¿Cuál es tu nombre completo?',
      options: [profile.name, 'Luis Martínez', 'Carlos Sánchez', 'Pedro Fernández'],
      correctIndex: 0,
    };
    case 'age': return {
      id, category, question: '¿Cuántos años tienes?',
      options: [String(profile.age - 5), String(profile.age - 2), String(profile.age), String(profile.age + 3)].sort(() => 0.5 - Math.random()),
      correctIndex: -1, // will be fixed below
    };
    case 'birthYear': return {
      id, category, question: '¿En qué año naciste?',
      options: [String(profile.birthYear - 3), String(profile.birthYear - 1), String(profile.birthYear), String(profile.birthYear + 2)].sort(() => 0.5 - Math.random()),
      correctIndex: -1,
    };
    case 'profession': return {
      id, category, question: '¿A qué te dedicabas profesionalmente?',
      options: [profile.profession, 'Médico', 'Abogado', 'Ingeniero'],
      correctIndex: 0,
    };
    case 'familyMember': return {
      id, category, question: '¿Cómo se llama tu pareja o familiar más cercano?',
      options: [profile.familyMember, 'Ana (hija)', 'Roberto (hijo)', 'Carmen (hermana)'],
      correctIndex: 0,
    };
    case 'biographicDetail': return {
      id, category, question: '¿Cuál de estos datos corresponde a tu historia personal?',
      options: [profile.biographicDetail, 'Nació en el extranjero', 'Trabajó como militar', 'Estudió en Madrid'],
      correctIndex: 0,
    };
  }
}

function fixCorrectIndex(q: PersonalQuestion, correct: string): PersonalQuestion {
  const idx = q.options.indexOf(correct);
  return { ...q, correctIndex: idx >= 0 ? idx : 0 };
}

export function generate(level: number, _seed: number, profile: PatientProfile = DEFAULT_PROFILE): ExerciseContent<PersonalOrientationStimuli> {
  const p = LEVELS[(level - 1)] ?? LEVELS[0]!;
  const questions: PersonalQuestion[] = p.categories.map((cat, idx) => {
    const q = buildQn(cat, profile, idx);
    if (cat === 'age') return fixCorrectIndex(q, String(profile.age));
    if (cat === 'birthYear') return fixCorrectIndex(q, String(profile.birthYear));
    return q;
  });
  return { level, seed: _seed, timeLimit: questions.length * 25, stimuli: { questions, patientProfile: profile } };
}

export function summarize(stimuli: PersonalOrientationStimuli, response: PersonalOrientationResponse): ExerciseSummary {
  const map = new Map(stimuli.questions.map(q => [q.id, q.correctIndex]));
  let hits = 0; let errors = 0; let totalRt = 0;
  for (const r of response) {
    if (r.chosenIndex === map.get(r.questionId)) hits++;
    else errors++;
    totalRt += r.reactionTimeMs;
  }
  return { hits, errors, reactionTimeMs: response.length ? Math.round(totalRt / response.length) : null, rawData: {} };
}
