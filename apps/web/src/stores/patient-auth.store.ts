import { create } from 'zustand';
import { api } from '../lib/api';

interface PatientUser {
  id: string;
  name: string;
  email: string | null;
}

interface PatientAuthState {
  patient: PatientUser | null;
  isLoading: boolean;
  login: (accessCode: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const usePatientAuthStore = create<PatientAuthState>((set) => ({
  patient: null,
  isLoading: true,

  init: () => {
    const token = localStorage.getItem('patientAccessToken');
    const patient = localStorage.getItem('patientUser');
    if (token && patient) {
      set({ patient: JSON.parse(patient) as PatientUser, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (accessCode) => {
    const { data } = await api.post<{
      patient: PatientUser;
      accessToken: string;
    }>('/auth/patient/login', { accessCode: accessCode.trim().toUpperCase() });
    localStorage.setItem('patientAccessToken', data.accessToken);
    localStorage.setItem('patientUser', JSON.stringify(data.patient));
    set({ patient: data.patient });
  },

  logout: () => {
    localStorage.removeItem('patientAccessToken');
    localStorage.removeItem('patientUser');
    set({ patient: null });
  },
}));
