import { useParams, Link } from 'react-router-dom';
import { useSession } from '../../hooks/useSessions';

const AREA_LABELS: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Func. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

function formatTime(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SessionSummaryPage() {
  const { id = '' } = useParams();
  const { data: session, isLoading } = useSession(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <p className="py-16 text-center text-gray-400">Sesión no encontrada.</p>;
  }

  const completedItems = session.items.filter((it) => it.result);
  const totalHits = completedItems.reduce((acc, it) => acc + (it.result?.hits ?? 0), 0);
  const totalErrors = completedItems.reduce((acc, it) => acc + (it.result?.errors ?? 0), 0);
  const accuracy = totalHits + totalErrors > 0
    ? Math.round((totalHits / (totalHits + totalErrors)) * 100)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Sesión completada</h1>
        <p className="mt-1 text-gray-500">
          {completedItems.length} de {session.items.length} ejercicios completados
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Precisión', value: accuracy !== null ? `${accuracy}%` : '—', color: 'text-indigo-600' },
          { label: 'Aciertos', value: totalHits, color: 'text-green-600' },
          { label: 'Errores', value: totalErrors, color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-exercise results */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="font-semibold text-gray-900">Detalle por ejercicio</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {session.items.map((item, i) => {
            const r = item.result;
            const acc = r && r.hits + r.errors > 0
              ? Math.round((r.hits / (r.hits + r.errors)) * 100)
              : null;

            return (
              <li key={item.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm text-gray-400">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.exercise.title}</p>
                    <p className="text-xs text-gray-400">
                      {AREA_LABELS[item.exercise.cognitiveArea] ?? item.exercise.cognitiveArea} · Nivel {item.level}
                    </p>
                  </div>
                </div>
                {r ? (
                  <div className="flex items-center gap-4 text-sm">
                    {acc !== null && (
                      <span className={`font-medium ${acc >= 70 ? 'text-green-600' : acc >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {acc}%
                      </span>
                    )}
                    <span className="text-gray-500">{r.hits}✓ {r.errors}✗</span>
                    {r.reactionTimeMs !== null && (
                      <span className="text-gray-400">{formatTime(r.reactionTimeMs)}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Sin completar</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to={`/pacientes/${session.patientId}`}
          className="flex-1 rounded-lg border border-gray-200 py-2.5 text-center text-sm text-gray-600 hover:bg-gray-50"
        >
          ← Volver al perfil
        </Link>
        <Link
          to="/pacientes"
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ir a pacientes
        </Link>
      </div>
    </div>
  );
}
