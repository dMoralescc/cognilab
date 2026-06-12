import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Exercise {
  id: string;
  slug: string;
  title: string;
  description: string;
  cognitiveArea: string;
  minLevel: number;
  maxLevel: number;
}

export interface SessionItem {
  id: string;
  level: number;
  order: number;
  exercise: { slug: string; title: string; cognitiveArea: string };
  result: { hits: number; errors: number; reactionTimeMs: number | null } | null;
}

export interface Session {
  id: string;
  patientId: string;
  status: string;
  remote: boolean;
  dueDate: string | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  items: SessionItem[];
}

export interface CreateSessionInput {
  patientId: string;
  items: Array<{ exerciseId: string; level: number; order: number }>;
  dueDate?: string | undefined;
  remote?: boolean | undefined;
}

export function useExercises(area?: string) {
  return useQuery({
    queryKey: ['exercises', area],
    queryFn: async () => {
      const { data } = await api.get<Exercise[]>('/exercises', {
        params: area ? { area } : {},
      });
      return data;
    },
  });
}

export function useSessions(patientId: string) {
  return useQuery({
    queryKey: ['sessions', patientId],
    queryFn: async () => {
      const { data } = await api.get<Session[]>('/sessions', {
        params: { patientId },
      });
      return data;
    },
    enabled: !!patientId,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['sessions', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get<Session>(`/sessions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSessionInput) =>
      api.post<Session>('/sessions', dto).then((r) => r.data),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['sessions', session.patientId] });
      qc.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Session>(`/sessions/${id}/start`).then((r) => r.data),
    onSuccess: (session) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: ['patients', session.patientId] });
    },
  });
}
