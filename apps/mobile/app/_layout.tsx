import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { useOfflineSync } from '../hooks/useOfflineSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function SyncProvider({ children }: { children: React.ReactNode }) {
  useOfflineSync();
  return <>{children}</>;
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <SyncProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SyncProvider>
    </QueryClientProvider>
  );
}
