import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { suggestLevel, COGNITIVE_PROGRAMS } from '@cognilab/shared';
import { useExercises, useCreateSession, type Exercise } from '../../hooks/useSessions';
import type { PatientDetail } from '../../hooks/usePatients';

const AREA_LABELS: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Func. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

const AREAS = Object.keys(AREA_LABELS);

interface SelectedItem {
  exercise: Exercise;
  level: number;
}

interface Props {
  patientId: string;
  patientHistory?: PatientDetail['sessions'];
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

type BrowserTab = 'ejercicios' | 'programas';

export function CreateSessionModal({ patientId, patientHistory = [], onClose, onCreated }: Props) {
  const navigate = useNavigate();
  const [browserTab, setBrowserTab] = useState<BrowserTab>('ejercicios');
  const [selectedArea, setSelectedArea] = useState('');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [remote, setRemote] = useState(false);
  const [error, setError] = useState('');

  const { data: exercises = [], isLoading: loadingExercises } = useExercises(selectedArea || undefined);
  const create = useCreateSession();

  // Build a map of slug → past results for auto-level suggestion
  const historyBySlug = useMemo(() => {
    const map = new Map<string, Array<{ hits: number; errors: number; level: number }>>();
    for (const session of patientHistory) {
      if (session.status !== 'COMPLETED') continue;
      for (const item of session.items) {
        if (!item.result) continue;
        const prev = map.get(item.exercise.slug) ?? [];
        prev.push({ hits: item.result.hits, errors: item.result.errors, level: item.level });
        map.set(item.exercise.slug, prev);
      }
    }
    return map;
  }, [patientHistory]);

  const getAutoLevel = (ex: Exercise) => {
    const past = historyBySlug.get(ex.slug) ?? [];
    return suggestLevel(past, ex.minLevel, ex.maxLevel);
  };

  const addExercise = (ex: Exercise) => {
    if (selected.some((s) => s.exercise.id === ex.id)) return;
    setSelected((prev) => [...prev, { exercise: ex, level: getAutoLevel(ex) }]);
  };

  const loadProgram = (slugs: Array<{ slug: string; level: number }>, allExercises: Exercise[]) => {
    const items: SelectedItem[] = [];
    for (const { slug, level } of slugs) {
      const ex = allExercises.find((e) => e.slug === slug);
      if (!ex || selected.some((s) => s.exercise.id === ex.id)) continue;
      const past = historyBySlug.get(ex.slug) ?? [];
      const suggested = past.length > 0 ? suggestLevel(past, ex.minLevel, ex.maxLevel) : level;
      items.push({ exercise: ex, level: suggested });
    }
    setSelected((prev) => [...prev, ...items]);
  };

  const removeExercise = (exerciseId: string) => {
    setSelected((prev) => prev.filter((s) => s.exercise.id !== exerciseId));
  };

  const setLevel = (exerciseId: string, level: number) => {
    setSelected((prev) =>
      prev.map((s) => (s.exercise.id === exerciseId ? { ...s, level } : s)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError('Añade al menos un ejercicio');
      return;
    }
    setError('');
    try {
      const session = await create.mutateAsync({
        patientId,
        items: selected.map((s, i) => ({
          exerciseId: s.exercise.id,
          level: s.level,
          order: i,
        })),
        ...(dueDate && { dueDate }),
        ...(remote && { remote: true }),
      });
      onCreated(session.id);
      if (!remote) navigate(`/sesiones/${session.id}`);
    } catch {
      setError('Error al crear la sesión');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Nueva sesión</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex flex-1 gap-0 overflow-hidden">
          {/* Left panel: exercise browser + programs */}
          <div className="flex w-1/2 flex-col border-r border-gray-100">
            {/* Tab switcher */}
            <div className="flex border-b border-gray-100">
              {(['ejercicios', 'programas'] as BrowserTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBrowserTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors ${
                    browserTab === tab
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'ejercicios' ? '📋 Ejercicios' : '🏥 Por patología'}
                </button>
              ))}
            </div>

            {browserTab === 'programas' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {COGNITIVE_PROGRAMS.map((prog) => {
                  const alreadyLoaded = prog.exercises.every((pe) =>
                    selected.some((s) => s.exercise.slug === pe.slug)
                  );
                  return (
                    <div key={prog.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{prog.icon}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{prog.name}</p>
                            <p className="text-xs text-indigo-600 font-medium">{prog.pathology}</p>
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{prog.description}</p>
                            <p className="mt-1 text-xs text-gray-400">{prog.exercises.length} ejercicios</p>
                          </div>
                        </div>
                        <button
                          onClick={() => loadProgram(prog.exercises, exercises)}
                          disabled={alreadyLoaded}
                          className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {alreadyLoaded ? '✓ Cargado' : 'Cargar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="mb-2 text-xs font-medium uppercase text-gray-500">Área cognitiva</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setSelectedArea('')}
                      className={`rounded-full px-2 py-0.5 text-xs ${!selectedArea ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Todas
                    </button>
                    {AREAS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setSelectedArea(a)}
                        className={`rounded-full px-2 py-0.5 text-xs ${selectedArea === a ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {AREA_LABELS[a]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingExercises ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : exercises.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-400">No hay ejercicios disponibles.</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                  {exercises.map((ex) => {
                    const isAdded = selected.some((s) => s.exercise.id === ex.id);
                    const suggested = getAutoLevel(ex);
                    const hasPast = (historyBySlug.get(ex.slug) ?? []).length > 0;
                    return (
                      <li
                        key={ex.id}
                        className={`flex items-center justify-between px-4 py-3 ${isAdded ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{ex.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">
                              {AREA_LABELS[ex.cognitiveArea]} · Niveles {ex.minLevel}–{ex.maxLevel}
                            </p>
                            {hasPast && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                Nv.{suggested} sugerido
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => isAdded ? removeExercise(ex.id) : addExercise(ex)}
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${isAdded ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                          {isAdded ? '✓ Añadido' : '+ Añadir'}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
              </>
            )}
          </div>

          {/* Selected items + config */}
          <div className="flex w-1/2 flex-col">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase text-gray-500">
                Sesión ({selected.length} ejercicio{selected.length !== 1 ? 's' : ''})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selected.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-400">
                  Selecciona ejercicios del panel izquierdo.
                </p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {selected.map((s, i) => {
                    const suggested = getAutoLevel(s.exercise);
                    const hasPast = (historyBySlug.get(s.exercise.slug) ?? []).length > 0;
                    return (
                      <li key={s.exercise.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-5 text-center text-xs text-gray-400">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{s.exercise.title}</p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-gray-400">Nivel:</span>
                            {Array.from(
                              { length: s.exercise.maxLevel - s.exercise.minLevel + 1 },
                              (_, k) => s.exercise.minLevel + k,
                            ).map((lv) => (
                              <button
                                key={lv}
                                onClick={() => setLevel(s.exercise.id, lv)}
                                className={`relative h-6 w-6 rounded text-xs font-medium transition-all ${
                                  s.level === lv
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                {lv}
                                {hasPast && lv === suggested && s.level !== lv && (
                                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                                )}
                              </button>
                            ))}
                            {hasPast && (
                              <span className="text-xs text-amber-600">↑ Nv.{suggested} auto</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeExercise(s.exercise.id)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Config footer */}
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 p-4">
              {/* Remote toggle */}
              <button
                type="button"
                onClick={() => setRemote((v) => !v)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                  remote
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${remote ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${remote ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold ${remote ? 'text-indigo-700' : 'text-gray-700'}`}>
                    📱 Sesión remota
                  </p>
                  <p className="text-xs text-gray-400">
                    {remote
                      ? 'El paciente la verá en su portal con su código de acceso'
                      : 'Activar para asignar al portal del paciente'}
                  </p>
                </div>
              </button>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Fecha límite (opcional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={create.isPending || selected.length === 0}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 ${
                    remote
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {create.isPending
                    ? 'Creando...'
                    : remote
                    ? '📱 Asignar al paciente'
                    : 'Crear sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
