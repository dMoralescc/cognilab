import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Patient {
  id: string;
  name: string;
  birthDate: string | null;
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  archivedAt: string | null;
  sessions: Array<{ id: string; status: string; createdAt: string; endAt: string | null }>;
  _count: { sessions: number };
}

export interface PatientDetail extends Patient {
  email: string | null;
  accessCode: string | null;
  sessions: Array<{
    id: string;
    status: string;
    createdAt: string;
    endAt: string | null;
    items: Array<{
      id: string;
      level: number;
      order: number;
      exercise: { slug: string; title: string; cognitiveArea: string; minLevel: number; maxLevel: number };
      result: {
        hits: number;
        errors: number;
        reactionTimeMs: number | null;
        completedAt: string;
      } | null;
    }>;
  }>;
}

export function usePatients(includeArchived = false) {
  return useQuery({
    queryKey: ['patients', { includeArchived }],
    queryFn: async () => {
      const { data } = await api.get<Patient[]>('/patients', {
        params: includeArchived ? { archived: true } : {},
      });
      return data;
    },
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: async () => {
      const { data } = await api.get<PatientDetail>(`/patients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface CreatePatientInput {
  name: string;
  birthDate?: string | undefined;
  diagnosis?: string | undefined;
  notes?: string | undefined;
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePatientInput) =>
      api.post<Patient>('/patients', dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export interface UpdatePatientInput {
  name?: string | undefined;
  birthDate?: string | undefined;
  diagnosis?: string | undefined;
  notes?: string | undefined;
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePatientInput) =>
      api.patch<Patient>(`/patients/${id}`, dto).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useGeneratePatientCode(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email?: string) =>
      api.post<{ accessCode: string }>(`/patients/${patientId}/generate-code`, { email }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients', patientId] }),
  });
}

export function useArchivePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      api.patch(`/patients/${id}/${archive ? 'archive' : 'unarchive'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}
