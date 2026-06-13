import axios from 'axios';

export const patientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
});

patientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('patientAccessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

patientApi.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('patientAccessToken');
      localStorage.removeItem('patientUser');
      window.location.href = '/paciente/login';
    }
    return Promise.reject(error);
  },
);
