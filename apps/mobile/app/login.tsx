import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth';

export default function LoginScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleLogin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 8) {
      Alert.alert('Código inválido', 'El código debe tener 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmed);
      router.replace('/sessions');
    } catch {
      Alert.alert('Acceso denegado', 'Código incorrecto. Comprueba con tu profesional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🧠</Text>
        <Text style={styles.title}>Cognilab</Text>
        <Text style={styles.subtitle}>Introduce tu código de acceso</Text>
      </View>

      {/* Code input */}
      <View style={styles.card}>
        <Text style={styles.label}>Código de acceso</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="XXXXXXXX"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <Text style={styles.hint}>8 caracteres · sin espacios</Text>

        <TouchableOpacity
          style={[styles.btn, (loading || code.trim().length < 8) && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading || code.trim().length < 8}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Entrar →</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Tu profesional te dará el código de acceso.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e1b4b',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 6,
    textAlign: 'center',
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
  btn: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
