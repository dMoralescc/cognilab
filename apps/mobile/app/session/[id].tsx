import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://cognilab-web.vercel.app';

export default function SessionPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();

  const sessionUrl = `${WEB_URL}/paciente/sesiones/${id}?token=${encodeURIComponent(token ?? '')}`;

  useEffect(() => {
    WebBrowser.openBrowserAsync(sessionUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: '#4f46e5',
      controlsColor: '#ffffff',
    }).then(() => {
      router.replace('/sessions');
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.replace('/sessions')} style={styles.backBtn}>
          <Text style={styles.backText}>← Mis sesiones</Text>
        </TouchableOpacity>
        <ActivityIndicator size="small" color="#4f46e5" />
      </View>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.label}>Abriendo sesión...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 52 : 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: { paddingVertical: 4, paddingRight: 16 },
  backText: { fontSize: 14, fontWeight: '600', color: '#4f46e5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  label: { fontSize: 16, color: '#6b7280' },
});
