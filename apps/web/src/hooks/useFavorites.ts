import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFavorites() {
  return useQuery<string[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await api.get<string[]>('/favorites');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) =>
      api.post<{ favorited: boolean }>(`/favorites/${exerciseId}`),
    onMutate: async (exerciseId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const prev = queryClient.getQueryData<string[]>(['favorites']) ?? [];
      const next = prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId];
      queryClient.setQueryData(['favorites'], next);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['favorites'], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
