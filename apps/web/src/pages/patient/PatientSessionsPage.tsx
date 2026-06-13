import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../../lib/patientApi';
import { usePatientAuthStore } from '../../stores/patient-auth.store';

interface SessionItem {
  id: string;
  exercise: { slug: string; title: string; cognitiveArea: string };
  level: number;
  result: { hits: number; errors: number } | null;
}

interface Session {
  id: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  items: SessionItem[];
}

const AREA_LABEL: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'F. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING:     { label: 'Pendiente',    class: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'En progreso',  class: 'bg-blue-100 text-blue-700' },
  COMPLETED:   { label: 'Completada',   class: 'bg-green-100 text-green-700' },
  EXPIRED:     { label: 'Expirada',     class: 'bg-gray-100 text-gray-500' },
};

export function PatientSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const patient = usePatientAuthStore((s) => s.patient);
  const navigate = useNavigate();

  useEffect(() => {
    patientApi.get<Session[]>('/patient/sessions')
      .then((r) => setSessions(r.data))
      .catch(() => { /* error handled by interceptor */ })
      .finally(() => setLoading(false));
  }, []);

  const pending = sessions.filter((s) => s.status === 'PENDING' || s.status === 'IN_PROGRESS');
  const completed = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'EXPIRED');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hola, {patient?.name?.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Aquí tienes tus sesiones de ejercicios cognitivos.</p>
      </div>

      {pending.length === 0 && completed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-4xl">🧩</p>
          <p className="mt-3 font-medium text-gray-600">No tienes sesiones asignadas aún</p>
          <p className="mt-1 text-sm text-gray-400">Tu profesional te asignará ejercicios próximamente.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Pendientes</h2>
          <div className="space-y-3">
            {pending.map((session) => (
              <SessionCard key={session.id} session={session} onPlay={() => navigate(`/paciente/sesiones/${session.id}`)} />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Completadas</h2>
          <div className="space-y-3">
            {completed.map((session) => (
              <SessionCard key={session.id} session={session} onPlay={null} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({ session, onPlay }: { session: Session; onPlay: (() => void) | null }) {
  const completedCount = session.items.filter((it) => it.result).length;
  const status = STATUS_CONFIG[session.status] ?? { label: session.status, class: 'bg-gray-100 text-gray-500' };
  const areas = [...new Set(session.items.map((it) => it.exercise.cognitiveArea))];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.class}`}>
            {status.label}
          </span>
          {areas.slice(0, 3).map((area) => (
            <span key={area} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {AREA_LABEL[area] ?? area}
            </span>
          ))}
        </div>
        <p className="mt-1 text-sm font-medium text-gray-800">
          {session.items.length} ejercicio{session.items.length !== 1 ? 's' : ''}
          {completedCount > 0 && session.status !== 'COMPLETED' && (
            <span className="ml-2 text-xs font-normal text-green-600">({completedCount} completados)</span>
          )}
        </p>
        <p className="text-xs text-gray-400">
          {new Date(session.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          {session.dueDate && (
            <span className="ml-2">· Entrega: {new Date(session.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
          )}
        </p>
      </div>
      {onPlay && (
        <button
          onClick={onPlay}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95"
        >
          {completedCount > 0 ? 'Continuar ▶' : 'Empezar ▶'}
        </button>
      )}
    </div>
  );
}
