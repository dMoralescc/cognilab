import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { usePatient } from '../../hooks/usePatients';
import { PatientFormModal } from './PatientFormModal';
import { CreateSessionModal } from '../sessions/CreateSessionModal';

const AREA_META: Record<string, { label: string; color: string; icon: string }> = {
  ATTENTION:          { label: 'Atención',         color: '#6366f1', icon: '👁' },
  MEMORY:             { label: 'Memoria',           color: '#0ea5e9', icon: '🧠' },
  EXECUTIVE_FUNCTIONS:{ label: 'Func. Ejecutivas', color: '#8b5cf6', icon: '⚙️' },
  LANGUAGE:           { label: 'Lenguaje',          color: '#10b981', icon: '💬' },
  VISUOSPATIAL:       { label: 'Visoespacial',      color: '#f59e0b', icon: '🔷' },
  ORIENTATION:        { label: 'Orientación',       color: '#ef4444', icon: '🧭' },
  SOCIAL_COGNITION:   { label: 'Cog. Social',      color: '#ec4899', icon: '🤝' },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada', EXPIRED: 'Expirada',
};
const STATUS_COLOR: Record<string, string> = {
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
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function pct(hits: number, errors: number) {
  const total = hits + errors;
  return total === 0 ? null : Math.round((hits / total) * 100);
}

type Tab = 'resumen' | 'areas' | 'historial';

export function PatientProfilePage() {
  const { id = '' } = useParams();
  const { data: patient, isLoading } = usePatient(id);
  const [editing, setEditing] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [activeArea, setActiveArea] = useState<string | null>(null);

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

  // ─── Overall accuracy trend (all areas combined) ───────────────────────────
  const overallTrend = completedSessions.slice().reverse().map((s, i) => {
    const results = s.items.filter((it) => it.result);
    if (results.length === 0) return null;
    const totalHits   = results.reduce((a, it) => a + it.result!.hits, 0);
    const totalErrors = results.reduce((a, it) => a + it.result!.errors, 0);
    return { sesión: `S${i + 1}`, precisión: pct(totalHits, totalErrors), fecha: formatDate(s.createdAt) };
  }).filter(Boolean) as Array<{ sesión: string; precisión: number; fecha: string }>;

  // ─── Per-area stats ────────────────────────────────────────────────────────
  const areaStats: Record<string, { hits: number; errors: number; sessions: number; lastPct: number | null; trend: number[] }> = {};
  for (const area of Object.keys(AREA_META)) {
    areaStats[area] = { hits: 0, errors: 0, sessions: 0, lastPct: null, trend: [] };
  }

  for (const session of completedSessions.slice().reverse()) {
    const byArea: Record<string, { hits: number; errors: number }> = {};
    for (const item of session.items) {
      if (!item.result) continue;
      const area = item.exercise.cognitiveArea;
      if (!byArea[area]) byArea[area] = { hits: 0, errors: 0 };
      byArea[area].hits   += item.result.hits;
      byArea[area].errors += item.result.errors;
    }
    for (const [area, { hits, errors }] of Object.entries(byArea)) {
      if (!areaStats[area]) continue;
      areaStats[area].hits   += hits;
      areaStats[area].errors += errors;
      areaStats[area].sessions += 1;
      const p = pct(hits, errors);
      if (p !== null) {
        areaStats[area].trend.push(p);
        areaStats[area].lastPct = p;
      }
    }
  }

  // Radar data
  const radarData = Object.entries(AREA_META).map(([key, { label }]) => ({
    area: label,
    key,
    precisión: areaStats[key] && areaStats[key].sessions > 0
      ? pct(areaStats[key].hits, areaStats[key].errors) ?? 0
      : 0,
  }));

  // Per-area line chart
  const areaKey = activeArea ?? Object.keys(AREA_META)[0]!;
  const areaTrend = completedSessions.slice().reverse().map((s, i) => {
    const items = s.items.filter((it) => it.result && it.exercise.cognitiveArea === areaKey);
    if (items.length === 0) return null;
    const h = items.reduce((a, it) => a + it.result!.hits, 0);
    const e = items.reduce((a, it) => a + it.result!.errors, 0);
    return { sesión: `S${i + 1}`, precisión: pct(h, e), fecha: formatDate(s.createdAt) };
  }).filter(Boolean) as Array<{ sesión: string; precisión: number; fecha: string }>;

  const age = calcAge(patient.birthDate);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'resumen',  label: 'Resumen' },
    { key: 'areas',    label: 'Por área cognitiva' },
    { key: 'historial', label: 'Historial' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/pacientes" className="text-sm text-gray-400 hover:text-gray-600">← Pacientes</Link>
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

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Sesiones totales',  value: patient.sessions.length, color: 'text-gray-800' },
          { label: 'Completadas',        value: completedSessions.length, color: 'text-green-600' },
          { label: 'Pendientes',         value: patient.sessions.filter((s) => s.status === 'PENDING').length, color: 'text-yellow-600' },
          { label: 'Áreas trabajadas',   value: Object.values(areaStats).filter((a) => a.sessions > 0).length, color: 'text-indigo-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Resumen */}
      {activeTab === 'resumen' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* Overall trend */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-900">Evolución general</h3>
              {overallTrend.length >= 2 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={overallTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="sesión" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, 'Precisión']}
                      labelFormatter={(l: string) => {
                        const d = overallTrend.find((c) => c.sesión === l);
                        return d ? `${l} · ${d.fecha}` : l;
                      }}
                    />
                    <Line type="monotone" dataKey="precisión" stroke="#6366f1" strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                  Se necesitan al menos 2 sesiones completadas.
                </div>
              )}
            </div>

            {/* Radar chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-900">Perfil cognitivo</h3>
              {completedSessions.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="precisión" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión media']} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                  Completa al menos una sesión para ver el perfil.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Notas clínicas</h3>
            {patient.notes ? (
              <p className="whitespace-pre-wrap text-sm text-gray-600">{patient.notes}</p>
            ) : (
              <p className="text-sm text-gray-400">Sin notas.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Por área */}
      {activeTab === 'areas' && (
        <div className="grid grid-cols-4 gap-5">
          {/* Area list */}
          <div className="col-span-1 space-y-2">
            {Object.entries(AREA_META).map(([key, { label, icon, color }]) => {
              const stats = areaStats[key];
              const acc = stats && stats.sessions > 0 ? pct(stats.hits, stats.errors) : null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveArea(key)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    (activeArea ?? Object.keys(AREA_META)[0]) === key
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{stats?.sessions ?? 0} sesiones</p>
                    </div>
                    {acc !== null && (
                      <span className="text-sm font-bold" style={{ color }}>{acc}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Area detail */}
          <div className="col-span-3 space-y-4">
            {(() => {
              const key = areaKey;
              const meta = AREA_META[key]!;
              const stats = areaStats[key];
              const acc = stats && stats.sessions > 0 ? pct(stats.hits, stats.errors) : null;

              // Exercises done for this area
              const exerciseMap = new Map<string, { title: string; hits: number; errors: number; sessions: number }>();
              for (const session of completedSessions) {
                for (const item of session.items) {
                  if (item.exercise.cognitiveArea !== key || !item.result) continue;
                  const prev = exerciseMap.get(item.exercise.slug) ?? { title: item.exercise.title, hits: 0, errors: 0, sessions: 0 };
                  prev.hits += item.result.hits;
                  prev.errors += item.result.errors;
                  prev.sessions += 1;
                  exerciseMap.set(item.exercise.slug, prev);
                }
              }

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5">
                    <span className="text-3xl">{meta.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{meta.label}</h3>
                      <p className="text-sm text-gray-500">{stats?.sessions ?? 0} sesiones · {exerciseMap.size} ejercicios distintos</p>
                    </div>
                    {acc !== null && (
                      <div className="text-right">
                        <p className="text-3xl font-extrabold" style={{ color: meta.color }}>{acc}%</p>
                        <p className="text-xs text-gray-400">precisión media</p>
                      </div>
                    )}
                    {acc === null && (
                      <p className="text-sm text-gray-400">Sin datos aún</p>
                    )}
                  </div>

                  {/* Trend chart for this area */}
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h4 className="mb-3 text-sm font-semibold text-gray-700">Evolución</h4>
                    {areaTrend.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={areaTrend}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="sesión" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión']}
                            labelFormatter={(l: string) => {
                              const d = areaTrend.find((c) => c.sesión === l);
                              return d ? `${l} · ${d.fecha}` : l;
                            }} />
                          <Line type="monotone" dataKey="precisión" stroke={meta.color} strokeWidth={2}
                            dot={{ fill: meta.color, r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                        Se necesitan al menos 2 sesiones con datos en esta área.
                      </div>
                    )}
                  </div>

                  {/* Exercise breakdown */}
                  {exerciseMap.size > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="border-b border-gray-100 px-5 py-3">
                        <h4 className="text-sm font-semibold text-gray-700">Ejercicios realizados</h4>
                      </div>
                      <ul className="divide-y divide-gray-50">
                        {[...exerciseMap.values()].map((ex) => {
                          const exAcc = pct(ex.hits, ex.errors);
                          const barWidth = exAcc ?? 0;
                          return (
                            <li key={ex.title} className="px-5 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-800">{ex.title}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{ex.sessions} sesión{ex.sessions !== 1 ? 'es' : ''}</span>
                                  {exAcc !== null && (
                                    <span className="font-bold" style={{ color: meta.color }}>{exAcc}%</span>
                                  )}
                                </div>
                              </div>
                              <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{ width: `${barWidth}%`, backgroundColor: meta.color }}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tab: Historial */}
      {activeTab === 'historial' && (
        <div className="rounded-xl border border-gray-200 bg-white">
          {patient.sessions.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">Sin sesiones registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {patient.sessions.map((s) => {
                const completedItems = s.items.filter((it) => it.result);
                const totalHits   = completedItems.reduce((a, it) => a + (it.result?.hits ?? 0), 0);
                const totalErrors = completedItems.reduce((a, it) => a + (it.result?.errors ?? 0), 0);
                const acc = pct(totalHits, totalErrors);

                return (
                  <li key={s.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? ''}`}>
                          {STATUS_LABEL[s.status] ?? s.status}
                        </span>
                        <span className="text-sm text-gray-600">{formatDate(s.createdAt)}</span>
                        {acc !== null && (
                          <span className="text-sm font-semibold text-indigo-600">{acc}% precisión</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {s.items.length} ejercicio{s.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {completedItems.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {s.items.map((it) => (
                          <div key={it.id} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
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

                    {s.items.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {[...new Set(s.items.map((it) => it.exercise.cognitiveArea))].map((area) => {
                          const meta = AREA_META[area];
                          return (
                            <span
                              key={area}
                              className="rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: meta ? `${meta.color}18` : '#f5f5f5', color: meta?.color ?? '#666' }}
                            >
                              {meta?.icon} {meta?.label ?? area}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {editing && (
        <PatientFormModal patient={patient} onClose={() => setEditing(false)} />
      )}

      {creatingSession && (
        <CreateSessionModal
          patientId={patient.id}
          patientHistory={patient.sessions}
          onClose={() => setCreatingSession(false)}
          onCreated={() => setCreatingSession(false)}
        />
      )}
    </div>
  );
}
