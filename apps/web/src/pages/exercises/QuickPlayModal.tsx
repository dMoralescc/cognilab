import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import { useCreateSession, type Exercise } from '../../hooks/useSessions';

interface Props {
  exercise: Exercise;
  onClose: () => void;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-violet-500',
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

export function QuickPlayModal({ exercise, onClose }: Props) {
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = usePatients();
  const createSession = useCreateSession();

  const [query, setQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [level, setLevel] = useState(exercise.minLevel);
  const [error, setError] = useState('');

  const activePatientsFiltered = useMemo(() => {
    const active = patients.filter((p) => !p.archivedAt);
    const q = query.toLowerCase().trim();
    return q ? active.filter((p) => p.name.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q)) : active;
  }, [patients, query]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handlePlay = async () => {
    if (!selectedPatientId) {
      setError('Selecciona un paciente para continuar.');
      return;
    }
    setError('');
    try {
      const session = await createSession.mutateAsync({
        patientId: selectedPatientId,
        items: [{ exerciseId: exercise.id, level, order: 0 }],
      });
      navigate(`/sesiones/${session.id}`);
    } catch {
      setError('Error al crear la sesión. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-0.5">
              Inicio rápido
            </p>
            <h2 className="text-lg font-bold text-gray-900">{exercise.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{exercise.description}</p>
          </div>
          <button onClick={onClose} className="ml-4 mt-0.5 text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Level selector */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Nivel de dificultad</p>
            <div className="flex gap-2">
              {Array.from({ length: exercise.maxLevel - exercise.minLevel + 1 }, (_, i) => exercise.minLevel + i).map((lv) => (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                    level === lv
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          {/* Patient selector */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">¿Quién va a jugar?</p>

            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar paciente…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-400 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Patient list */}
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-50">
              {isLoading ? (
                <div className="flex h-24 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
              ) : activePatientsFiltered.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  {query ? 'Sin resultados' : 'No hay pacientes activos.'}
                </div>
              ) : (
                activePatientsFiltered.map((patient) => {
                  const isSelected = patient.id === selectedPatientId;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(patient.name)}`}>
                        {initials(patient.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-sm font-semibold ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                          {patient.name}
                        </p>
                        {patient.diagnosis && (
                          <p className="truncate text-xs text-gray-400">{patient.diagnosis}</p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="shrink-0 rounded-full bg-indigo-600 p-0.5 text-white">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-600">{error}</p>}

          {/* Summary + CTA */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {selectedPatient ? (
                <>
                  <span className="font-semibold text-gray-900">{selectedPatient.name}</span>
                  {' · '}
                  <span className="text-indigo-600">Nivel {level}</span>
                </>
              ) : (
                <span className="text-gray-400">Selecciona un paciente</span>
              )}
            </div>
            <button
              onClick={handlePlay}
              disabled={!selectedPatientId || createSession.isPending}
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createSession.isPending ? 'Creando…' : '▶ Jugar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
