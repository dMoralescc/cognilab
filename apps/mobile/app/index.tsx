import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth';

export default function Index() {
  const { token, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (token) {
      router.replace('/sessions');
    } else {
      router.replace('/login');
    }
  }, [token, isLoading, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' }}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}
