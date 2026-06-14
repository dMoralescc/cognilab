import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export interface PatientUser {
  id: string;
  name: string;
  email: string | null;
}

interface AuthState {
  patient: PatientUser | null;
  token: string | null;
  isLoading: boolean;
  login: (accessCode: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  patient: null,
  token: null,
  isLoading: true,

  init: async () => {
    const token = await SecureStore.getItemAsync('patientToken');
    const raw = await SecureStore.getItemAsync('patientUser');
    if (token && raw) {
      set({ token, patient: JSON.parse(raw) as PatientUser, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (accessCode: string) => {
    const { data } = await axios.post<{ accessToken: string; patient: PatientUser }>(
      `${API_URL}/auth/patient/login`,
      { accessCode },
    );
    await SecureStore.setItemAsync('patientToken', data.accessToken);
    await SecureStore.setItemAsync('patientUser', JSON.stringify(data.patient));
    set({ token: data.accessToken, patient: data.patient });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('patientToken');
    await SecureStore.deleteItemAsync('patientUser');
    set({ token: null, patient: null });
  },
}));
