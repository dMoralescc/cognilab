import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173';

export default function SessionPlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, patient } = useAuthStore();
  const webviewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const sessionUrl = `${WEB_URL}/paciente/sesiones/${id}`;

  // Injected JS: set auth in localStorage so the web portal accepts the session
  const injectedJS = `
    (function() {
      localStorage.setItem('patientAccessToken', ${JSON.stringify(token ?? '')});
      localStorage.setItem('patientUser', ${JSON.stringify(JSON.stringify(patient ?? {}))});
      true;
    })();
  `;

  const handleMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string };
      if (msg.type === 'session:complete') {
        router.replace('/sessions');
      }
    } catch {
      // ignore non-JSON messages
    }
  };

  return (
    <View style={styles.container}>
      {/* Back bar */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.replace('/sessions')} style={styles.backBtn}>
          <Text style={styles.backText}>← Mis sesiones</Text>
        </TouchableOpacity>
        {!ready && <ActivityIndicator size="small" color="#4f46e5" />}
      </View>

      <WebView
        ref={webviewRef}
        source={{ uri: sessionUrl }}
        style={styles.webview}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
        onLoadEnd={() => setReady(true)}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled={Platform.OS === 'ios'}
        // Allow mixed content (http) on Android for dev
        mixedContentMode="always"
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        )}
      />
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
  webview: { flex: 1 },
  loading: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
});
