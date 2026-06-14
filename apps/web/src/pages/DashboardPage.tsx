import { Link } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';
import { useAuthStore } from '../stores/auth.store';

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  EXPIRED: 'Expirada',
};
const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function DashboardPage() {
  const { professional } = useAuthStore();
  const { data: patients = [], isLoading } = usePatients();

  const totalSessions = patients.reduce((acc, p) => acc + p._count.sessions, 0);
  const activePatients = patients.filter((p) => !p.archivedAt).length;
  const recentPatients = [...patients]
    .filter((p) => !p.archivedAt)
    .sort((a, b) => {
      const aDate = a.sessions[0]?.createdAt ?? a.createdAt;
      const bDate = b.sessions[0]?.createdAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 5);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Hola, {professional?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500">Aquí tienes el resumen de tu actividad.</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Activos', value: activePatients, color: 'text-indigo-600' },
          { label: 'Sesiones', value: totalSessions, color: 'text-emerald-600' },
          { label: 'Archivados', value: patients.length - activePatients, color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5 text-center sm:text-left">
            <p className="text-xs text-gray-500 sm:text-sm">{label}</p>
            <p className={`mt-0.5 text-2xl font-bold sm:text-3xl ${color}`}>
              {isLoading ? '—' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Actividad reciente</h2>
          <Link to="/pacientes" className="text-sm text-indigo-600 hover:underline">
            Ver todos →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : recentPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>No hay pacientes aún.</p>
            <Link to="/pacientes" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
              Crear el primer paciente
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentPatients.map((p) => {
              const last = p.sessions[0];
              return (
                <li key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="font-medium text-gray-900 hover:text-indigo-600"
                    >
                      {p.name}
                    </Link>
                    {p.diagnosis && (
                      <p className="text-xs text-gray-400">{p.diagnosis}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {last ? (
                      <>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[last.status] ?? ''}`}>
                          {statusLabel[last.status] ?? last.status}
                        </span>
                        <span className="text-gray-400">{formatDate(last.createdAt)}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Sin sesiones</span>
                    )}
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
