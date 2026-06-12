import { create } from 'zustand';
import { api } from '../lib/api';

interface Professional {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  professional: Professional | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  professional: null,
  isLoading: true,

  init: () => {
    const token = localStorage.getItem('accessToken');
    const professional = localStorage.getItem('professional');
    if (token && professional) {
      set({ professional: JSON.parse(professional) as Professional, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post<{
      professional: Professional;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('professional', JSON.stringify(data.professional));
    set({ professional: data.professional });
  },

  register: async (name, email, password) => {
    const { data } = await api.post<{
      professional: Professional;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', { name, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('professional', JSON.stringify(data.professional));
    set({ professional: data.professional });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignorar */ }
    localStorage.clear();
    set({ professional: null });
  },
}));
