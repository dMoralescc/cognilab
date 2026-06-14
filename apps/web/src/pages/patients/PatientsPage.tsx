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

const AVATAR_COLORS = [
  'from-indigo-400 to-violet-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-fuchsia-400 to-purple-500',
];

function avatarGradient(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function IconEdit() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

function IconUnarchive() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
    </svg>
  );
}

function PatientCard({
  p,
  onEdit,
  onArchive,
}: {
  p: Patient;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const lastSession = p.sessions[0];

  return (
    <div className={`rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden ${p.archivedAt ? 'opacity-60' : ''}`}>
      {/* Main row — tappable, goes to profile */}
      <Link to={`/pacientes/${p.id}`} className="flex items-center gap-3 px-4 py-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(p.name)}`}>
          <span className="text-sm font-bold text-white">{initials(p.name)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 leading-snug truncate">{p.name}</p>
          <p className="mt-0.5 text-xs text-gray-400 truncate">
            {[calcAge(p.birthDate), p.diagnosis].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {p._count.sessions} sesión{p._count.sessions !== 1 ? 'es' : ''}
            </span>
            {lastSession && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[lastSession.status] ?? ''}`}>
                {statusLabel[lastSession.status] ?? lastSession.status}
              </span>
            )}
          </div>
        </div>

        <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Action bar */}
      <div className="flex border-t border-gray-50">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors"
        >
          <IconEdit />
          Editar
        </button>
        <div className="w-px bg-gray-100" />
        <button
          onClick={onArchive}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 transition-colors"
        >
          {p.archivedAt ? <IconUnarchive /> : <IconArchive />}
          {p.archivedAt ? 'Desarchivar' : 'Archivar'}
        </button>
      </div>
    </div>
  );
}

export function PatientsPage() {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [modal, setModal] = useState<{ open: boolean; patient?: Patient | undefined }>({ open: false });

  // Always fetch all (including archived) so we can show counts on both tabs
  const { data: allPatients = [], isLoading } = usePatients(true);
  const archive = useArchivePatient();

  const active = allPatients.filter((p) => !p.archivedAt);
  const archived = allPatients.filter((p) => !!p.archivedAt);
  const patients = tab === 'active' ? active : archived;

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
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Pacientes</h1>
        <button
          onClick={() => setModal({ open: true })}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex rounded-xl bg-gray-100 p-1 gap-1">
        {(['active', 'archived'] as const).map((t) => {
          const isActive = tab === t;
          const count = t === 'active' ? active.length : archived.length;
          const label = t === 'active' ? 'Activos' : 'Archivados';
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
                isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                  isActive
                    ? t === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {patients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-7 w-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="font-medium text-gray-500">
            {tab === 'active' ? 'No hay pacientes activos' : 'No hay pacientes archivados'}
          </p>
          {tab === 'active' && (
            <button
              onClick={() => setModal({ open: true })}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2.5 sm:hidden">
            {patients.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                onEdit={() => setModal({ open: true, patient: p })}
                onArchive={() => archive.mutate({ id: p.id, archive: !p.archivedAt })}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Edad</th>
                  <th className="px-4 py-3">Diagnóstico</th>
                  <th className="px-4 py-3">Última sesión</th>
                  <th className="px-4 py-3">Sesiones</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((p) => {
                  const lastSession = p.sessions[0];
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${p.archivedAt ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(p.name)}`}>
                            <span className="text-xs font-bold text-white">{initials(p.name)}</span>
                          </div>
                          <Link to={`/pacientes/${p.id}`} className="font-medium text-indigo-600 hover:underline">
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{calcAge(p.birthDate)}</td>
                      <td className="px-4 py-3 text-gray-500">{p.diagnosis ?? '—'}</td>
                      <td className="px-4 py-3">
                        {lastSession ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[lastSession.status] ?? ''}`}>
                            {statusLabel[lastSession.status] ?? lastSession.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sin sesiones</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p._count.sessions}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModal({ open: true, patient: p })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="Editar"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => archive.mutate({ id: p.id, archive: !p.archivedAt })}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            title={p.archivedAt ? 'Desarchivar' : 'Archivar'}
                          >
                            {p.archivedAt ? <IconUnarchive /> : <IconArchive />}
                          </button>
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
