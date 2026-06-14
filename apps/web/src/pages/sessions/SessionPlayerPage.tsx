import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession, useStartSession } from '../../hooks/useSessions';
import { api } from '../../lib/api';
import { renderExercise, type ExerciseResult } from './exercises/renderExercise';

const AREA_CONFIG: Record<string, { label: string; icon: string; gradient: string; badge: string }> = {
  ATTENTION:           { label: 'Atención',         icon: '👁️',  gradient: 'from-blue-50 to-indigo-100',    badge: 'bg-blue-100 text-blue-700' },
  MEMORY:              { label: 'Memoria',           icon: '🧠',  gradient: 'from-purple-50 to-violet-100',  badge: 'bg-purple-100 text-purple-700' },
  EXECUTIVE_FUNCTIONS: { label: 'Func. Ejecutivas',  icon: '⚡',  gradient: 'from-amber-50 to-orange-100',   badge: 'bg-amber-100 text-amber-700' },
  LANGUAGE:            { label: 'Lenguaje',          icon: '💬',  gradient: 'from-emerald-50 to-green-100',  badge: 'bg-emerald-100 text-emerald-700' },
  VISUOSPATIAL:        { label: 'Visoespacial',      icon: '🎯',  gradient: 'from-cyan-50 to-teal-100',      badge: 'bg-cyan-100 text-cyan-700' },
  ORIENTATION:         { label: 'Orientación',       icon: '🧭',  gradient: 'from-rose-50 to-pink-100',      badge: 'bg-rose-100 text-rose-700' },
  SOCIAL_COGNITION:    { label: 'Cog. Social',       icon: '🤝',  gradient: 'from-fuchsia-50 to-pink-100',   badge: 'bg-fuchsia-100 text-fuchsia-700' },
};

function useTimer(active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const reset = useCallback(() => setElapsed(0), []);
  return { elapsed, reset };
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

type Phase = 'intro' | 'playing' | 'feedback' | 'done';

export function SessionPlayerPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: session, isLoading } = useSession(id);
  const startSession = useStartSession();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('intro');
  const [lastResult, setLastResult] = useState<ExerciseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { elapsed, reset: resetTimer } = useTimer(phase === 'playing');

  useEffect(() => {
    if (!session || initialized) return;
    setInitialized(true);

    const firstPending = session.items.findIndex((it) => !it.result);
    if (firstPending === -1) {
      navigate(`/sesiones/${session.id}/resumen`);
      return;
    }

    setCurrentIndex(firstPending);

    if (session.status === 'IN_PROGRESS') {
      setStarted(true);
      setPhase('intro');
    }
  }, [session, initialized, navigate]);

  const currentItem = session?.items[currentIndex];

  const handleStart = async () => {
    if (!session || started) return;
    setStarted(true);
    try { await startSession.mutateAsync(session.id); } catch { /* already in_progress */ }
    setPhase('intro');
  };

  const beginExercise = () => {
    resetTimer();
    setPhase('playing');
  };

  const submitResult = async (result: ExerciseResult) => {
    if (!currentItem) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/results', {
        sessionItemId: currentItem.id,
        hits: result.hits,
        errors: result.errors,
        ...(result.reactionTimeMs !== null && { reactionTimeMs: result.reactionTimeMs }),
        ...(result.rawData && { rawData: result.rawData }),
      });
      setLastResult(result);
      setPhase('feedback');
    } catch {
      setError('Error al guardar el resultado');
    } finally {
      setSubmitting(false);
    }
  };

  const nextExercise = () => {
    if (!session) return;
    if (currentIndex + 1 >= session.items.length) {
      navigate(`/sesiones/${session.id}/resumen`);
    } else {
      setCurrentIndex((i) => i + 1);
      setLastResult(null);
      setPhase('intro');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) return <p className="py-16 text-center text-gray-400">Sesión no encontrada.</p>;

  if (session.status === 'COMPLETED') {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">Esta sesión ya está completada.</p>
        <button
          onClick={() => navigate(`/sesiones/${session.id}/resumen`)}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ver resumen
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress bar */}
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
          <span>
            Ejercicio {Math.min(currentIndex + 1, session.items.length)} de {session.items.length}
            {session.items.some((it) => it.result) && (
              <span className="ml-2 text-xs font-medium text-green-600">
                · {session.items.filter((it) => it.result).length} completado{session.items.filter((it) => it.result).length !== 1 ? 's' : ''}
              </span>
            )}
          </span>
          {phase === 'playing' && <span className="font-mono text-indigo-600">{formatTime(elapsed)}</span>}
        </div>
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {session.items.map((it, i) => (
            <div
              key={it.id}
              className={`flex-1 rounded-full transition-all ${
                it.result ? 'bg-green-500' : i === currentIndex ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Start gate */}
      {!started && (() => {
        const completedCount = session.items.filter((it) => it.result).length;
        const pendingCount = session.items.length - completedCount;
        const isResume = session.status === 'IN_PROGRESS' || completedCount > 0;
        return (
          <div className="animate-slide-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className={`bg-gradient-to-br ${isResume ? 'from-amber-50 to-orange-100' : 'from-indigo-50 to-violet-100'} px-8 pb-8 pt-10 text-center`}>
              <div className="mb-3 text-5xl">{isResume ? '▶️' : '🧩'}</div>
              <h1 className="text-3xl font-bold text-gray-900">{isResume ? 'Reanudar sesión' : 'Sesión lista'}</h1>
              <p className="mt-2 text-gray-600">
                {isResume
                  ? `${completedCount} de ${session.items.length} ejercicios completados · quedan ${pendingCount}`
                  : `${session.items.length} ejercicio${session.items.length !== 1 ? 's' : ''} programado${session.items.length !== 1 ? 's' : ''}`}
              </p>
              <div className="mt-4 flex justify-center gap-1.5">
                {session.items.map((it, i) => (
                  <div key={i} className={`h-2 w-6 rounded-full ${it.result ? 'bg-green-400' : i === currentIndex ? 'bg-amber-400' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>
            <div className="px-8 py-6 text-center">
              <button
                onClick={handleStart}
                className={`rounded-xl px-10 py-3 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 ${isResume ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'}`}
              >
                {isResume ? 'Reanudar ▶' : 'Comenzar sesión ▶'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Exercise intro */}
      {started && phase === 'intro' && currentItem && (() => {
        const area = AREA_CONFIG[currentItem.exercise.cognitiveArea] ?? { label: currentItem.exercise.cognitiveArea, icon: '🔷', gradient: 'from-gray-50 to-gray-100', badge: 'bg-gray-100 text-gray-700' };
        return (
          <div className="animate-slide-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className={`bg-gradient-to-br ${area.gradient} px-8 pb-6 pt-8 text-center`}>
              <div className="mb-3 text-5xl">{area.icon}</div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${area.badge}`}>{area.label}</span>
              <h2 className="mt-3 text-2xl font-bold text-gray-900">{currentItem.exercise.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{currentItem.exercise.description}</p>
            </div>
            <div className="px-8 pb-8 pt-5 text-center">
              <div className="mb-5 flex items-center justify-center gap-1.5">
                {Array.from({ length: currentItem.exercise.maxLevel }, (_, i) => (
                  <div key={i} className={`h-2 w-7 rounded-full ${i < currentItem.level ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                ))}
                <span className="ml-2 text-xs text-gray-500">Nivel {currentItem.level} de {currentItem.exercise.maxLevel}</span>
              </div>
              <p className="mb-5 text-sm text-gray-500">Ejercicio {currentIndex + 1} de {session.items.length}</p>
              <button
                onClick={beginExercise}
                className="rounded-xl bg-indigo-600 px-10 py-3 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
              >
                Empezar ▶
              </button>
            </div>
          </div>
        );
      })()}

      {/* Exercise player */}
      {started && phase === 'playing' && currentItem && (
        <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6">
          {renderExercise({
            slug: currentItem.exercise.slug,
            level: currentItem.level,
            elapsed,
            onComplete: (r) => { void submitResult(r); },
            submitting,
          })}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Feedback */}
      {phase === 'feedback' && lastResult && currentItem && (() => {
        const total = lastResult.hits + lastResult.errors;
        const accuracy = total > 0 ? Math.round((lastResult.hits / total) * 100) : 100;
        const isGood = accuracy >= 75;
        const accuracyColor = accuracy >= 80 ? 'bg-green-500' : accuracy >= 60 ? 'bg-amber-500' : 'bg-red-500';
        return (
          <div className="animate-slide-up rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full ${isGood ? 'bg-green-100' : 'bg-amber-100'}`}>
              <span className="animate-pop-in text-4xl">{isGood ? '✅' : '⚠️'}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{isGood ? '¡Muy bien!' : '¡Completado!'}</h2>
            <p className="mt-1 text-sm text-gray-500">{currentItem.exercise.title}</p>
            <div className="mt-6 flex justify-center gap-4">
              <div className="rounded-xl bg-green-50 px-5 py-3">
                <p className="text-3xl font-bold text-green-600">{lastResult.hits}</p>
                <p className="mt-0.5 text-xs font-medium text-green-700">Aciertos</p>
              </div>
              {lastResult.errors > 0 && (
                <div className="rounded-xl bg-red-50 px-5 py-3">
                  <p className="text-3xl font-bold text-red-500">{lastResult.errors}</p>
                  <p className="mt-0.5 text-xs font-medium text-red-600">Errores</p>
                </div>
              )}
              {lastResult.reactionTimeMs !== null && lastResult.reactionTimeMs > 0 && (
                <div className="rounded-xl bg-indigo-50 px-5 py-3">
                  <p className="text-3xl font-bold text-indigo-600">{(lastResult.reactionTimeMs / 1000).toFixed(1)}s</p>
                  <p className="mt-0.5 text-xs font-medium text-indigo-700">Tiempo medio</p>
                </div>
              )}
            </div>
            {total > 0 && (
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Precisión</span>
                  <span className="font-semibold">{accuracy}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-3 rounded-full transition-all duration-700 ${accuracyColor}`} style={{ width: `${accuracy}%` }} />
                </div>
              </div>
            )}
            <button
              onClick={nextExercise}
              className="mt-7 rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95"
            >
              {currentIndex + 1 >= session.items.length ? '🏆 Ver resumen' : 'Siguiente ejercicio →'}
            </button>
          </div>
        );
      })()}
    </div>
  );
}
