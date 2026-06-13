import { useParams, Link } from 'react-router-dom';
import { usePatient } from '../../hooks/usePatients';

const AREA_LABEL: Record<string, string> = {
  ATTENTION: 'Atención', MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Funciones Ejecutivas', LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial', ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cognición Social',
};

function pct(h: number, e: number) {
  const t = h + e;
  return t === 0 ? '—' : `${Math.round((h / t) * 100)}%`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcAge(bd: string | null) {
  if (!bd) return null;
  return Math.floor((Date.now() - new Date(bd).getTime()) / 31_557_600_000);
}

export function PrintReportPage() {
  const { id = '' } = useParams();
  const { data: patient, isLoading } = usePatient(id);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Cargando…</div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-gray-400">
        Paciente no encontrado. <Link to="/pacientes" className="text-indigo-600">Volver</Link>
      </div>
    );
  }

  const completedSessions = patient.sessions.filter((s) => s.status === 'COMPLETED');
  const age = calcAge(patient.birthDate);

  return (
    <>
      {/* Print toolbar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between bg-indigo-600 px-6 py-3">
        <Link to={`/pacientes/${id}`} className="text-sm text-indigo-200 hover:text-white">
          ← Volver al perfil
        </Link>
        <span className="text-sm font-semibold text-white">Vista de impresión</span>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 shadow-sm"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      {/* Printable content */}
      <div className="mx-auto max-w-4xl p-8 print:p-6 font-sans">
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-indigo-600 pb-4 mb-6">
          <div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Cognilab</p>
            <h1 className="text-2xl font-extrabold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-500">
              {age !== null ? `${age} años · ` : ''}
              {patient.diagnosis ?? 'Sin diagnóstico'}
            </p>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Informe generado el {fmtDate(new Date().toISOString())}</p>
            <p className="mt-1">{completedSessions.length} sesiones completadas</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {(() => {
            const totalHits   = completedSessions.flatMap((s) => s.items).reduce((a, it) => a + (it.result?.hits ?? 0), 0);
            const totalErrors = completedSessions.flatMap((s) => s.items).reduce((a, it) => a + (it.result?.errors ?? 0), 0);
            const areas = new Set(completedSessions.flatMap((s) => s.items.map((it) => it.exercise.cognitiveArea))).size;
            return [
              { label: 'Sesiones', value: completedSessions.length },
              { label: 'Ejercicios', value: completedSessions.flatMap((s) => s.items.filter((it) => it.result)).length },
              { label: 'Precisión media', value: pct(totalHits, totalErrors) },
              { label: 'Áreas trabajadas', value: areas },
            ];
          })().map(({ label, value }) => (
            <div key={label} className="rounded-lg border-2 border-gray-100 p-3 text-center">
              <p className="text-xl font-extrabold text-indigo-600">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Notas */}
        {patient.notes && (
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Notas clínicas</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
          </div>
        )}

        {/* Sessions detail */}
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">Detalle de sesiones</h2>

        {completedSessions.length === 0 ? (
          <p className="text-sm text-gray-400">Sin sesiones completadas.</p>
        ) : (
          <div className="space-y-6">
            {completedSessions.map((s, si) => {
              const items = s.items.filter((it) => it.result);
              const totalH = items.reduce((a, it) => a + (it.result?.hits ?? 0), 0);
              const totalE = items.reduce((a, it) => a + (it.result?.errors ?? 0), 0);
              return (
                <div key={s.id} className="break-inside-avoid">
                  <div className="flex items-center justify-between rounded-t-lg bg-indigo-50 px-4 py-2 border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-700">Sesión {si + 1} — {fmtDate(s.createdAt)}</p>
                    <p className="text-xs text-indigo-600">Precisión: {pct(totalH, totalE)}</p>
                  </div>
                  <table className="w-full border-collapse text-xs border border-t-0 border-indigo-100">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-left">
                        <th className="px-3 py-1.5 font-semibold">Ejercicio</th>
                        <th className="px-3 py-1.5 font-semibold">Área</th>
                        <th className="px-3 py-1.5 font-semibold text-center">Nivel</th>
                        <th className="px-3 py-1.5 font-semibold text-center">Aciertos</th>
                        <th className="px-3 py-1.5 font-semibold text-center">Errores</th>
                        <th className="px-3 py-1.5 font-semibold text-center">Precisión</th>
                        <th className="px-3 py-1.5 font-semibold text-center">TR medio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((it) => (
                        <tr key={it.id} className="border-t border-gray-100 even:bg-gray-50">
                          <td className="px-3 py-1.5 text-gray-800 font-medium">{it.exercise.title}</td>
                          <td className="px-3 py-1.5 text-gray-500">{AREA_LABEL[it.exercise.cognitiveArea] ?? it.exercise.cognitiveArea}</td>
                          <td className="px-3 py-1.5 text-center text-gray-600">{it.level}</td>
                          <td className="px-3 py-1.5 text-center text-green-700">{it.result?.hits ?? '—'}</td>
                          <td className="px-3 py-1.5 text-center text-red-600">{it.result?.errors ?? '—'}</td>
                          <td className="px-3 py-1.5 text-center font-semibold text-indigo-600">
                            {it.result ? pct(it.result.hits, it.result.errors) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-center text-gray-500">
                            {it.result?.reactionTimeMs ? `${Math.round(it.result.reactionTimeMs)}ms` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:left-0 print:right-0">
          Cognilab · Plataforma de rehabilitación cognitiva · {fmtDate(new Date().toISOString())}
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}
