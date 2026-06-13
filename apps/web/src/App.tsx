import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientProfilePage } from './pages/patients/PatientProfilePage';
import { SessionPlayerPage } from './pages/sessions/SessionPlayerPage';
import { SessionSummaryPage } from './pages/sessions/SessionSummaryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { PrintReportPage } from './pages/patients/PrintReportPage';

export default function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

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
