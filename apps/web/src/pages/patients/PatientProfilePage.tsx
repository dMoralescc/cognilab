import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { usePatient } from '../../hooks/usePatients';
import { PatientFormModal } from './PatientFormModal';
import { CreateSessionModal } from '../sessions/CreateSessionModal';

const areaLabel: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'Func. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada', EXPIRED: 'Expirada',
};
const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
};

function calcAge(birthDate: string | null) {
  if (!birthDate) return null;
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / 31_557_600_000);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function PatientProfilePage() {
  const { id = '' } = useParams();
  const { data: patient, isLoading } = usePatient(id);
  const [editing, setEditing] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-16 text-center text-gray-400">
        Paciente no encontrado.{' '}
        <Link to="/pacientes" className="text-indigo-600 hover:underline">Volver</Link>
      </div>
    );
  }

  const completedSessions = patient.sessions.filter((s) => s.status === 'COMPLETED');

  const chartData = completedSessions.slice().reverse().map((s, i) => {
    const results = s.items.filter((it) => it.result);
    if (results.length === 0) return null;
    const accuracy = Math.round(
      (results.reduce((acc, it) => acc + it.result!.hits, 0) /
        results.reduce((acc, it) => acc + it.result!.hits + it.result!.errors, 0)) *
        100,
    );
    return { sesión: `S${i + 1}`, precisión: accuracy, fecha: formatDate(s.createdAt) };
  }).filter(Boolean);

  const age = calcAge(patient.birthDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/pacientes" className="text-sm text-gray-400 hover:text-gray-600">
            ← Pacientes
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-sm text-gray-500">
              {age !== null ? `${age} años · ` : ''}{patient.diagnosis ?? 'Sin diagnóstico'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCreatingSession(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nueva sesión
          </button>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Editar datos
          </button>
        </div>
      </div>

      {/* Info + notas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Notas clínicas</h2>
          {patient.notes ? (
            <p className="whitespace-pre-wrap text-sm text-gray-600">{patient.notes}</p>
          ) : (
            <p className="text-sm text-gray-400">Sin notas.</p>
          )}
        </div>
        <div className="space-y-3">
          {[
            { label: 'Sesiones totales', value: patient.sessions.length },
            { label: 'Completadas', value: completedSessions.length },
            { label: 'Pendientes', value: patient.sessions.filter((s) => s.status === 'PENDING').length },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-indigo-600">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de evolución */}
      {chartData.length >= 2 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Evolución de precisión</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sesión" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                formatter={(val: number) => [`${val}%`, 'Precisión']}
                labelFormatter={(l: string) => {
                  const d = chartData.find((c) => c?.sesión === l);
                  return d ? `${l} · ${d.fecha}` : l;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="precisión"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: '#4f46e5', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historial de sesiones */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Historial de sesiones</h2>
        </div>

        {patient.sessions.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Sin sesiones registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {patient.sessions.map((s) => {
              const completedItems = s.items.filter((it) => it.result);
              const totalHits = completedItems.reduce((acc, it) => acc + (it.result?.hits ?? 0), 0);
              const totalErrors = completedItems.reduce((acc, it) => acc + (it.result?.errors ?? 0), 0);
              const accuracy = totalHits + totalErrors > 0
                ? Math.round((totalHits / (totalHits + totalErrors)) * 100)
                : null;

              return (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status] ?? ''}`}>
                        {statusLabel[s.status] ?? s.status}
                      </span>
                      <span className="text-sm text-gray-600">{formatDate(s.createdAt)}</span>
                      {accuracy !== null && (
                        <span className="text-sm font-medium text-indigo-600">{accuracy}% precisión</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {s.items.length} ejercicio{s.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {completedItems.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {s.items.map((it) => (
                        <div
                          key={it.id}
                          className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600"
                          title={it.exercise.title}
                        >
                          <span className="font-medium">{it.exercise.title}</span>
                          {it.result && (
                            <span className="ml-1 text-gray-400">
                              · Nv.{it.level} · {it.result.hits}✓ {it.result.errors}✗
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Áreas cognitivas trabajadas */}
                  {s.items.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[...new Set(s.items.map((it) => it.exercise.cognitiveArea))].map((area) => (
                        <span key={area} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
                          {areaLabel[area] ?? area}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <PatientFormModal patient={patient} onClose={() => setEditing(false)} />
      )}

      {creatingSession && (
        <CreateSessionModal
          patientId={patient.id}
          onClose={() => setCreatingSession(false)}
          onCreated={() => setCreatingSession(false)}
        />
      )}
    </div>
  );
}
