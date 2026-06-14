import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePatients, useArchivePatient, type Patient } from '../../hooks/usePatients';
import { PatientFormModal } from './PatientFormModal';

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000);
  return `${age} años`;
}

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

function PatientCard({ p, onEdit, onArchive }: { p: Patient; onEdit: () => void; onArchive: () => void }) {
  const lastSession = p.sessions[0];
  const initials = p.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm ${p.archivedAt ? 'opacity-50' : ''}`}>
      {/* Avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
        <span className="text-sm font-bold text-indigo-700">{initials}</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link to={`/pacientes/${p.id}`} className="block font-semibold text-gray-900 leading-tight truncate">
          {p.name}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">{calcAge(p.birthDate)}</span>
          {p.diagnosis && (
            <span className="text-xs text-gray-400 truncate max-w-[120px]">{p.diagnosis}</span>
          )}
          {lastSession && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[lastSession.status] ?? ''}`}>
              {statusLabel[lastSession.status] ?? lastSession.status}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-400">{p._count.sessions} sesión{p._count.sessions !== 1 ? 'es' : ''}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col gap-1">
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-sm hover:bg-indigo-50 active:scale-90 transition-all"
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={onArchive}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-sm hover:bg-gray-200 active:scale-90 transition-all"
          title={p.archivedAt ? 'Desarchivar' : 'Archivar'}
        >
          {p.archivedAt ? '📂' : '🗂️'}
        </button>
      </div>
    </div>
  );
}

export function PatientsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; patient?: Patient | undefined }>({ open: false });
  const { data: patients = [], isLoading } = usePatients(showArchived);
  const archive = useArchivePatient();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Pacientes</h1>
          <p className="text-sm text-gray-500">{patients.length} paciente{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          + Nuevo
        </button>
      </div>

      {/* Filter */}
      <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="rounded"
        />
        Mostrar archivados
      </label>

      {patients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-4xl">👤</p>
          <p className="mt-3 font-medium text-gray-500">No hay pacientes. Crea el primero.</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card list ── */}
          <div className="space-y-2 sm:hidden">
            {patients.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                onEdit={() => setModal({ open: true, patient: p })}
                onArchive={() => archive.mutate({ id: p.id, archive: !p.archivedAt })}
              />
            ))}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3">Diagnóstico</th>
                  <th className="px-4 py-3">Última sesión</th>
                  <th className="px-4 py-3">Sesiones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => {
                  const lastSession = p.sessions[0];
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${p.archivedAt ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <Link to={`/pacientes/${p.id}`} className="font-medium text-indigo-600 hover:underline">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{calcAge(p.birthDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.diagnosis ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lastSession ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[lastSession.status] ?? ''}`}>
                            {statusLabel[lastSession.status] ?? lastSession.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin sesiones</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p._count.sessions}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ open: true, patient: p })}
                            className="text-gray-400 hover:text-gray-700"
                            title="Editar"
                          >✏️</button>
                          <button
                            onClick={() => archive.mutate({ id: p.id, archive: !p.archivedAt })}
                            className="text-gray-400 hover:text-gray-700"
                            title={p.archivedAt ? 'Desarchivar' : 'Archivar'}
                          >{p.archivedAt ? '📂' : '🗂️'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal.open && (
        <PatientFormModal
          patient={modal.patient}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  );
}
