import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

const WS_URL = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://localhost:3000').replace('/api', '');

export function useRealtimeResults(patientId: string) {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('accessToken');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('result:submitted', (data: { patientId: string; sessionId: string }) => {
      if (data.patientId !== patientId) return;
      void queryClient.invalidateQueries({ queryKey: ['sessions', patientId] });
      void queryClient.invalidateQueries({ queryKey: ['patients', patientId] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, patientId, queryClient]);
}
