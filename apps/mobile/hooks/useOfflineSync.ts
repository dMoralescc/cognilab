import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getPendingResults, clearPendingResults } from '../lib/offline';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const syncingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (!state.isConnected || syncingRef.current) return;

      const pending = await getPendingResults();
      if (pending.length === 0) return;

      syncingRef.current = true;
      try {
        for (const result of pending) {
          await api.post('/patient/results', {
            sessionItemId: result.sessionItemId,
            hits: result.hits,
            errors: result.errors,
            ...(result.reactionTimeMs !== null && { reactionTimeMs: result.reactionTimeMs }),
            rawData: result.rawData,
          });
        }
        await clearPendingResults();
        void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      } catch {
        // will retry next time connection is restored
      } finally {
        syncingRef.current = false;
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
