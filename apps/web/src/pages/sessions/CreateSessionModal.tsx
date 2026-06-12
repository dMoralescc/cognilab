import { useState } from 'react';
import { useExercises, useCreateSession, type Exercise } from '../../hooks/useSessions';

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
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export function CreateSessionModal({ patientId, onClose, onCreated }: Props) {
  const [selectedArea, setSelectedArea] = useState('');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const { data: exercises = [], isLoading: loadingExercises } = useExercises(selectedArea || undefined);
  const create = useCreateSession();

  const addExercise = (ex: Exercise) => {
    if (selected.some((s) => s.exercise.id === ex.id)) return;
    setSelected((prev) => [...prev, { exercise: ex, level: ex.minLevel }]);
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
      });
      onCreated(session.id);
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
          {/* Exercise browser */}
          <div className="flex w-1/2 flex-col border-r border-gray-100">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Área cognitiva</p>
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
                    return (
                      <li
                        key={ex.id}
                        className={`flex items-center justify-between px-4 py-3 ${isAdded ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{ex.title}</p>
                          <p className="text-xs text-gray-400">{AREA_LABELS[ex.cognitiveArea]} · Niveles {ex.minLevel}–{ex.maxLevel}</p>
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
          </div>

          {/* Selected items + config */}
          <div className="flex w-1/2 flex-col">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase">
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
                  {selected.map((s, i) => (
                    <li key={s.exercise.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-5 text-center text-xs text-gray-400">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{s.exercise.title}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs text-gray-400">Nivel:</span>
                          {Array.from(
                            { length: s.exercise.maxLevel - s.exercise.minLevel + 1 },
                            (_, k) => s.exercise.minLevel + k,
                          ).map((lv) => (
                            <button
                              key={lv}
                              onClick={() => setLevel(s.exercise.id, lv)}
                              className={`h-5 w-5 rounded text-xs ${s.level === lv ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                              {lv}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeExercise(s.exercise.id)}
                        className="text-gray-300 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Config footer */}
            <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4 space-y-3">
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
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {create.isPending ? 'Creando...' : 'Crear sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
