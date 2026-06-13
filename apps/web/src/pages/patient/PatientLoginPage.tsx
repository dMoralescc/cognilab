import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuthStore } from '../../stores/patient-auth.store';

export function PatientLoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = usePatientAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(code);
      navigate('/paciente');
    } catch {
      setError('Código incorrecto. Pídele a tu profesional el código de acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-100 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Cognilab</h1>
          <p className="mt-1 text-sm text-indigo-200">Portal del paciente</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          <label className="block text-sm font-medium text-gray-700">
            Código de acceso
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: AB3K9PQR"
            maxLength={8}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-gray-900 placeholder-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            autoFocus
          />
          <p className="mt-2 text-center text-xs text-gray-400">
            Tu profesional te habrá dado este código
          </p>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="border-t border-gray-100 px-8 py-4 text-center">
          <a href="/login" className="text-xs text-gray-400 hover:text-gray-600">
            ¿Eres profesional? Accede aquí
          </a>
        </div>
      </div>
    </div>
  );
}
