import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { usePatientAuthStore } from './stores/patient-auth.store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { PatientLayout } from './components/PatientLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientProfilePage } from './pages/patients/PatientProfilePage';
import { SessionPlayerPage } from './pages/sessions/SessionPlayerPage';
import { SessionSummaryPage } from './pages/sessions/SessionSummaryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { PrintReportPage } from './pages/patients/PrintReportPage';
import { PatientLoginPage } from './pages/patient/PatientLoginPage';
import { PatientSessionsPage } from './pages/patient/PatientSessionsPage';
import { PatientSessionPlayerPage } from './pages/patient/PatientSessionPlayerPage';

function PatientProtectedRoute({ children }: { children: React.ReactNode }) {
  const patient = usePatientAuthStore((s) => s.patient);
  const isLoading = usePatientAuthStore((s) => s.isLoading);
  if (isLoading) return null;
  if (!patient) return <Navigate to="/paciente/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const patientInit = usePatientAuthStore((s) => s.init);

  useEffect(() => {
    init();
    patientInit();
  }, [init, patientInit]);

  return (
    <Routes>
      {/* Auth profesional */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Portal del paciente */}
      <Route path="/paciente/login" element={<PatientLoginPage />} />
      <Route
        path="/paciente"
        element={
          <PatientProtectedRoute>
            <PatientLayout />
          </PatientProtectedRoute>
        }
      >
        <Route index element={<PatientSessionsPage />} />
        <Route path="sesiones/:id" element={<PatientSessionPlayerPage />} />
      </Route>

      {/* Panel del profesional */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pacientes" element={<PatientsPage />} />
          <Route path="/pacientes/:id" element={<PatientProfilePage />} />
          <Route path="/pacientes/:id/informe" element={<PrintReportPage />} />
          <Route path="/ejercicios" element={<ExercisesPage />} />
          <Route path="/sesiones/:id" element={<SessionPlayerPage />} />
          <Route path="/sesiones/:id/resumen" element={<SessionSummaryPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
