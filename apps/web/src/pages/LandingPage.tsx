import { Link } from 'react-router-dom';

const AREAS = [
  { icon: '👁', label: 'Atención', desc: '10 ejercicios', color: '#6366f1', bg: '#eef2ff' },
  { icon: '🧠', label: 'Memoria', desc: '12 ejercicios', color: '#0ea5e9', bg: '#f0f9ff' },
  { icon: '⚙️', label: 'Funciones Ejecutivas', desc: '12 ejercicios', color: '#8b5cf6', bg: '#f5f3ff' },
  { icon: '💬', label: 'Lenguaje', desc: '8 ejercicios', color: '#10b981', bg: '#f0fdf4' },
  { icon: '🔷', label: 'Visoespacial', desc: '8 ejercicios', color: '#f59e0b', bg: '#fffbeb' },
  { icon: '🧭', label: 'Orientación', desc: '4 ejercicios', color: '#ef4444', bg: '#fef2f2' },
  { icon: '🤝', label: 'Cognición Social', desc: '6 ejercicios', color: '#ec4899', bg: '#fdf2f8' },
];

const FEATURES = [
  {
    icon: '🆓',
    title: '100% gratuito y open source',
    desc: 'Sin licencias, sin límites. El código es tuyo para inspeccionar, modificar y distribuir.',
  },
  {
    icon: '🧩',
    title: '60 ejercicios clínicos',
    desc: 'Diseñados por y para profesionales de la salud. Cada uno con 5 niveles de dificultad y variantes infinitas.',
  },
  {
    icon: '📱',
    title: 'Web + móvil',
    desc: 'Portal web para el profesional. App móvil y portal web para el paciente. Sin instalar nada.',
  },
  {
    icon: '📡',
    title: 'Telerrehabilitación',
    desc: 'Asigna sesiones remotas. El paciente las realiza desde casa y tú ves los resultados en tiempo real.',
  },
  {
    icon: '📊',
    title: 'Métricas longitudinales',
    desc: 'Gráficos de evolución por área cognitiva. El algoritmo sugiere el nivel óptimo automáticamente.',
  },
  {
    icon: '🔒',
    title: 'Privacidad por diseño',
    desc: 'Auto-hospedable. Tus datos no salen de tu servidor. Cumple con los requisitos de privacidad clínica.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-extrabold text-gray-900">🧠 Cognilab</span>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/cognilab/cognilab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              GitHub
            </a>
            <Link
              to="/paciente/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Soy paciente
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Acceder
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-36 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
          ✨ Open source · Gratuito · Sin límites
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900">
          Rehabilitación cognitiva <span className="text-indigo-600">para todos</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          Plataforma clínica de estimulación y rehabilitación cognitiva. 60 ejercicios, 7 áreas cognitivas, telerrehabilitación y métricas longitudinales. Gratis para siempre.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/registro"
            className="rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
          >
            Empezar gratis →
          </Link>
          <a
            href="https://github.com/cognilab/cognilab"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Ver en GitHub
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-400">Sin tarjeta de crédito · Sin límite de pacientes · Auto-hospedable</p>
      </section>

      {/* Areas */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-2 text-center text-3xl font-extrabold text-gray-900">7 áreas cognitivas · 60 ejercicios</h2>
          <p className="mb-12 text-center text-gray-500">Cada ejercicio con 5 niveles de dificultad y variantes infinitas gracias a semillas reproducibles.</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            {AREAS.map((area) => (
              <div
                key={area.label}
                className="flex flex-col items-center rounded-2xl border border-transparent p-5 text-center transition-all hover:border-gray-200 hover:bg-white hover:shadow-sm"
                style={{ backgroundColor: area.bg }}
              >
                <span className="text-3xl">{area.icon}</span>
                <p className="mt-2 text-sm font-semibold" style={{ color: area.color }}>{area.label}</p>
                <p className="mt-0.5 text-xs text-gray-400">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-gray-900">Todo lo que necesitas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-bold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open source CTA */}
      <section className="bg-indigo-600 py-20 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-3xl font-extrabold">Construido por la comunidad clínica</h2>
          <p className="mt-4 text-lg text-indigo-200">
            Cognilab es open source. Neuropsicólogos y terapeutas de todo el mundo pueden proponer ejercicios, mejorar la plataforma y adaptarla a sus necesidades.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/cognilab/cognilab"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-white px-8 py-4 font-bold text-indigo-600 hover:bg-indigo-50"
            >
              ⭐ Ver en GitHub
            </a>
            <a
              href="https://github.com/cognilab/cognilab/issues/new?template=exercise-proposal.md"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border-2 border-white/40 px-8 py-4 font-semibold text-white hover:bg-white/10"
            >
              Proponer ejercicio
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        <p>
          Cognilab · MIT License ·{' '}
          <a href="https://github.com/cognilab/cognilab" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
