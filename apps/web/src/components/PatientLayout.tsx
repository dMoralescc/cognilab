import { Outlet, useNavigate } from 'react-router-dom';
import { usePatientAuthStore } from '../stores/patient-auth.store';

export function PatientLayout() {
  const patient = usePatientAuthStore((s) => s.patient);
  const logout = usePatientAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/paciente/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700">
              <span className="text-lg">🧠</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Cognilab</p>
              {patient && <p className="text-xs text-gray-500">{patient.name}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
