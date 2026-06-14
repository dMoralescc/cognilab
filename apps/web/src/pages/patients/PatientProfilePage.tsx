import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { usePatient, useGeneratePatientCode } from '../../hooks/usePatients';
import { PatientFormModal } from './PatientFormModal';
import { CreateSessionModal } from '../sessions/CreateSessionModal';
import { exportPatientPdf } from '../../lib/exportPdf';
import { useRealtimeResults } from '../../hooks/useRealtimeResults';

const AREA_META: Record<string, { label: string; color: string; short: string }> = {
  ATTENTION:           { label: 'Atención',          color: '#6366f1', short: 'AT' },
  MEMORY:              { label: 'Memoria',            color: '#0ea5e9', short: 'ME' },
  EXECUTIVE_FUNCTIONS: { label: 'Func. Ejecutivas',  color: '#8b5cf6', short: 'EF' },
  LANGUAGE:            { label: 'Lenguaje',           color: '#10b981', short: 'LE' },
  VISUOSPATIAL:        { label: 'Visoespacial',       color: '#f59e0b', short: 'VS' },
  ORIENTATION:         { label: 'Orientación',        color: '#ef4444', short: 'OR' },
  SOCIAL_COGNITION:    { label: 'Cog. Social',        color: '#ec4899', short: 'CS' },
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
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  useRealtimeResults(id);
  const [creatingSession, setCreatingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [activeArea, setActiveArea] = useState<string>(Object.keys(AREA_META)[0]!);
  const [codeEmail, setCodeEmail] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [showAccessPanel, setShowAccessPanel] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const generateCode = useGeneratePatientCode(id);

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
  const age = calcAge(patient.birthDate);

  // Overall accuracy trend
  const overallTrend = completedSessions.slice().reverse().map((s, i) => {
    const results = s.items.filter((it) => it.result);
    if (results.length === 0) return null;
    const h = results.reduce((a, it) => a + it.result!.hits, 0);
    const e = results.reduce((a, it) => a + it.result!.errors, 0);
    return { sesión: `S${i + 1}`, precisión: pct(h, e), fecha: formatDate(s.createdAt) };
  }).filter(Boolean) as Array<{ sesión: string; precisión: number; fecha: string }>;

  // Per-area stats
  const areaStats: Record<string, { hits: number; errors: number; sessions: number; lastPct: number | null }> = {};
  for (const area of Object.keys(AREA_META)) {
    areaStats[area] = { hits: 0, errors: 0, sessions: 0, lastPct: null };
  }
  for (const session of completedSessions.slice().reverse()) {
    const byArea: Record<string, { hits: number; errors: number }> = {};
    for (const item of session.items) {
      if (!item.result) continue;
      const area = item.exercise.cognitiveArea;
      if (!byArea[area]) byArea[area] = { hits: 0, errors: 0 };
      byArea[area].hits += item.result.hits;
      byArea[area].errors += item.result.errors;
    }
    for (const [area, { hits, errors }] of Object.entries(byArea)) {
      if (!areaStats[area]) continue;
      areaStats[area].hits += hits;
      areaStats[area].errors += errors;
      areaStats[area].sessions += 1;
      const p = pct(hits, errors);
      if (p !== null) areaStats[area].lastPct = p;
    }
  }

  const radarData = Object.entries(AREA_META).map(([key, { label }]) => ({
    area: label,
    precisión: areaStats[key] && areaStats[key].sessions > 0
      ? pct(areaStats[key].hits, areaStats[key].errors) ?? 0
      : 0,
  }));

  // Per-area trend
  const areaMeta = AREA_META[activeArea]!;
  const areaTrend = completedSessions.slice().reverse().map((s, i) => {
    const items = s.items.filter((it) => it.result && it.exercise.cognitiveArea === activeArea);
    if (items.length === 0) return null;
    const h = items.reduce((a, it) => a + it.result!.hits, 0);
    const e = items.reduce((a, it) => a + it.result!.errors, 0);
    return { sesión: `S${i + 1}`, precisión: pct(h, e), fecha: formatDate(s.createdAt) };
  }).filter(Boolean) as Array<{ sesión: string; precisión: number; fecha: string }>;

  const pdfExport = () => {
    exportPatientPdf({
      patientName: patient.name,
      diagnosis: patient.diagnosis,
      centerName: '',
      sessions: completedSessions.map((s) => ({
        createdAt: s.createdAt,
        exercises: s.items
          .filter((it) => it.result)
          .map((it) => ({
            title: it.exercise.title,
            cognitiveArea: it.exercise.cognitiveArea,
            level: it.level,
            hits: it.result!.hits,
            errors: it.result!.errors,
            reactionTimeMs: it.result!.reactionTimeMs,
            completedAt: it.result!.completedAt,
          })),
      })),
    });
  };

  const initials = patient.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-4 pb-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link to="/pacientes" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90 transition-all">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>

        {/* Avatar + name */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 leading-tight">{patient.name}</h1>
            <p className="text-xs text-gray-500">
              {[age !== null ? `${age} años` : null, patient.diagnosis ?? 'Sin diagnóstico'].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setCreatingSession(true)}
          className="flex shrink-0 items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden sm:inline">Nueva sesión</span>
        </button>

        {/* More actions */}
        <div className="relative">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-90 transition-all"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
                {[
                  { label: 'Editar datos', action: () => { setEditing(true); setShowActions(false); } },
                  { label: 'Ver informe', action: () => { navigate(`/pacientes/${id}/informe`); setShowActions(false); } },
                  { label: 'Exportar PDF', action: () => { pdfExport(); setShowActions(false); } },
                  { label: 'Acceso remoto', action: () => { setShowAccessPanel((v) => !v); setShowActions(false); } },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Totales',    value: patient.sessions.length,                                     color: 'text-gray-800' },
          { label: 'Completadas', value: completedSessions.length,                                   color: 'text-green-600' },
          { label: 'Pendientes', value: patient.sessions.filter((s) => s.status === 'PENDING').length, color: 'text-yellow-600' },
          { label: 'Áreas',      value: Object.values(areaStats).filter((a) => a.sessions > 0).length, color: 'text-indigo-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`mt-0.5 text-2xl font-bold sm:text-3xl ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Acceso remoto (collapsible) ── */}
      {showAccessPanel && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-indigo-900">Acceso remoto del paciente</h3>
            <button onClick={() => setShowAccessPanel(false)} className="text-indigo-400 hover:text-indigo-600 text-lg leading-none">×</button>
          </div>
          {patient.accessCode && (
            <div className="mb-3 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xl font-bold tracking-widest text-indigo-700 bg-white rounded-lg px-3 py-1.5 border border-indigo-200">
                {patient.accessCode}
              </span>
              <button
                onClick={() => { void navigator.clipboard.writeText(patient.accessCode ?? ''); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                {codeCopied ? '¡Copiado!' : 'Copiar'}
              </button>
              <a href={`${window.location.origin}/paciente/login`} target="_blank" rel="noreferrer"
                className="text-xs text-indigo-500 hover:underline">Portal →</a>
            </div>
          )}
          {!patient.accessCode && (
            <p className="mb-3 text-sm text-indigo-600">Sin código. Genera uno para que el paciente acceda a su portal.</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <input type="email" value={codeEmail} onChange={(e) => setCodeEmail(e.target.value)}
              placeholder="Email (opcional)" className="min-w-0 flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none" />
            <button onClick={() => generateCode.mutate(codeEmail || undefined)} disabled={generateCode.isPending}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {patient.accessCode ? 'Regenerar' : 'Generar código'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        {([
          { key: 'resumen',  label: 'Resumen' },
          { key: 'areas',    label: 'Áreas' },
          { key: 'historial', label: 'Historial' },
        ] as Array<{ key: Tab; label: string }>).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ── */}
      {activeTab === 'resumen' && (
        <div className="space-y-4">
          {/* Charts: stacked on mobile, 2-col on desktop */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Evolución general</h3>
              {overallTrend.length >= 2 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={overallTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="sesión" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={32} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión']}
                      labelFormatter={(l: string) => { const d = overallTrend.find((c) => c.sesión === l); return d ? `${l} · ${d.fecha}` : l; }} />
                    <Line type="monotone" dataKey="precisión" stroke="#6366f1" strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400 text-center px-4">
                  Se necesitan al menos 2 sesiones completadas.
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Perfil cognitivo</h3>
              {completedSessions.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={radarData} margin={{ top: 0, right: 24, bottom: 0, left: 24 }}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="precisión" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión media']} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-gray-400 text-center px-4">
                  Completa al menos una sesión para ver el perfil.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {patient.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Notas clínicas</h3>
              <p className="whitespace-pre-wrap text-sm text-gray-600">{patient.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Áreas ── */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          {/* Area selector — horizontal scroll pills on mobile, sidebar on desktop */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:hidden">
            {Object.entries(AREA_META).map(([key, { label, color, short }]) => {
              const stats = areaStats[key];
              const acc = stats && stats.sessions > 0 ? pct(stats.hits, stats.errors) : null;
              return (
                <button key={key} onClick={() => setActiveArea(key)}
                  className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                    activeArea === key ? 'border-transparent text-white shadow' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                  style={activeArea === key ? { backgroundColor: color } : {}}
                >
                  <span className="text-[11px] font-bold">{short}</span>
                  <span className="whitespace-nowrap text-[10px] font-normal opacity-80">{acc !== null ? `${acc}%` : '—'}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop: sidebar + detail */}
          <div className="hidden sm:grid sm:grid-cols-4 sm:gap-5">
            <div className="space-y-2">
              {Object.entries(AREA_META).map(([key, { label, color }]) => {
                const stats = areaStats[key];
                const acc = stats && stats.sessions > 0 ? pct(stats.hits, stats.errors) : null;
                return (
                  <button key={key} onClick={() => setActiveArea(key)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      activeArea === key ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-semibold text-gray-800">{label}</p>
                      {acc !== null && <span className="text-sm font-bold shrink-0" style={{ color }}>{acc}%</span>}
                    </div>
                    <p className="text-xs text-gray-400">{stats?.sessions ?? 0} sesiones</p>
                  </button>
                );
              })}
            </div>
            <div className="col-span-3">
              <AreaDetail activeArea={activeArea} areaMeta={areaMeta} areaStats={areaStats} areaTrend={areaTrend} completedSessions={completedSessions} />
            </div>
          </div>

          {/* Mobile: just the detail */}
          <div className="sm:hidden">
            <AreaDetail activeArea={activeArea} areaMeta={areaMeta} areaStats={areaStats} areaTrend={areaTrend} completedSessions={completedSessions} />
          </div>
        </div>
      )}

      {/* ── Tab: Historial ── */}
      {activeTab === 'historial' && (
        <div className="space-y-2.5">
          {patient.sessions.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
              Sin sesiones registradas.
            </div>
          ) : (
            patient.sessions.map((s) => {
              const completedItems = s.items.filter((it) => it.result);
              const h = completedItems.reduce((a, it) => a + (it.result?.hits ?? 0), 0);
              const e = completedItems.reduce((a, it) => a + (it.result?.errors ?? 0), 0);
              const acc = pct(h, e);
              const areas = [...new Set(s.items.map((it) => it.exercise.cognitiveArea))];

              return (
                <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? ''}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(s.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {acc !== null && (
                        <span className="font-semibold text-indigo-600">{acc}%</span>
                      )}
                      <span>{s.items.length} ej.</span>
                    </div>
                  </div>

                  {/* Area badges */}
                  {areas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {areas.map((area) => {
                        const meta = AREA_META[area];
                        if (!meta) return null;
                        return (
                          <span key={area} className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                            {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Exercise list */}
                  {completedItems.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {s.items.map((it) => (
                        <div key={it.id} className="rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          <span className="font-medium">{it.exercise.title}</span>
                          {it.result && (
                            <span className="ml-1 text-gray-400">Nv.{it.level} · {it.result.hits}✓ {it.result.errors}✗</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {editing && <PatientFormModal patient={patient} onClose={() => setEditing(false)} />}

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

// Extracted to avoid repetition between mobile/desktop
function AreaDetail({
  activeArea,
  areaMeta,
  areaStats,
  areaTrend,
  completedSessions,
}: {
  activeArea: string;
  areaMeta: { label: string; color: string; short: string };
  areaStats: Record<string, { hits: number; errors: number; sessions: number; lastPct: number | null }>;
  areaTrend: Array<{ sesión: string; precisión: number; fecha: string }>;
  completedSessions: Array<{
    id: string;
    items: Array<{
      id: string;
      exercise: { slug: string; title: string; cognitiveArea: string; minLevel: number; maxLevel: number };
      result: { hits: number; errors: number; reactionTimeMs: number | null; completedAt: string } | null;
      level: number;
      order: number;
    }>;
  }>;
}) {
  const stats = areaStats[activeArea];
  const acc = stats && stats.sessions > 0 ? pct(stats.hits, stats.errors) : null;

  const exerciseMap = new Map<string, { title: string; hits: number; errors: number; sessions: number }>();
  for (const session of completedSessions) {
    for (const item of session.items) {
      if (item.exercise.cognitiveArea !== activeArea || !item.result) continue;
      const prev = exerciseMap.get(item.exercise.slug) ?? { title: item.exercise.title, hits: 0, errors: 0, sessions: 0 };
      prev.hits += item.result.hits;
      prev.errors += item.result.errors;
      prev.sessions += 1;
      exerciseMap.set(item.exercise.slug, prev);
    }
  }

  return (
    <div className="space-y-3">
      {/* Area header card */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white text-sm font-bold"
          style={{ backgroundColor: areaMeta.color }}>
          {areaMeta.short}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900">{areaMeta.label}</h3>
          <p className="text-xs text-gray-500">{stats?.sessions ?? 0} sesiones · {exerciseMap.size} ejercicios</p>
        </div>
        {acc !== null ? (
          <div className="text-right shrink-0">
            <p className="text-2xl font-extrabold" style={{ color: areaMeta.color }}>{acc}%</p>
            <p className="text-[10px] text-gray-400">precisión</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 shrink-0">Sin datos</p>
        )}
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Evolución</h4>
        {areaTrend.length >= 2 ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={areaTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sesión" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" width={32} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Precisión']}
                labelFormatter={(l: string) => { const d = areaTrend.find((c) => c.sesión === l); return d ? `${l} · ${d.fecha}` : l; }} />
              <Line type="monotone" dataKey="precisión" stroke={areaMeta.color} strokeWidth={2}
                dot={{ fill: areaMeta.color, r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-28 items-center justify-center text-sm text-gray-400 text-center">
            Se necesitan al menos 2 sesiones con datos en esta área.
          </div>
        )}
      </div>

      {/* Exercise breakdown */}
      {exerciseMap.size > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-700">Ejercicios realizados</h4>
          </div>
          <ul className="divide-y divide-gray-50">
            {[...exerciseMap.values()].map((ex) => {
              const exAcc = pct(ex.hits, ex.errors);
              return (
                <li key={ex.title} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{ex.title}</p>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                      <span>{ex.sessions} ses.</span>
                      {exAcc !== null && <span className="font-bold" style={{ color: areaMeta.color }}>{exAcc}%</span>}
                    </div>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${exAcc ?? 0}%`, backgroundColor: areaMeta.color }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
