import { useQuery } from '@tanstack/react-query';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/auth';
import { api } from '../lib/api';
import { cacheSessions, getCachedSessions } from '../lib/offline';

interface SessionItem {
  id: string;
  exercise: { slug: string; title: string; cognitiveArea: string };
  level: number;
  result: { hits: number; errors: number } | null;
}

interface Session {
  id: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  items: SessionItem[];
}

const AREA_LABEL: Record<string, string> = {
  ATTENTION: 'Atención',
  MEMORY: 'Memoria',
  EXECUTIVE_FUNCTIONS: 'F. Ejecutivas',
  LANGUAGE: 'Lenguaje',
  VISUOSPATIAL: 'Visoespacial',
  ORIENTATION: 'Orientación',
  SOCIAL_COGNITION: 'Cog. Social',
};

const AREA_COLOR: Record<string, string> = {
  ATTENTION: '#6366f1',
  MEMORY: '#0ea5e9',
  EXECUTIVE_FUNCTIONS: '#8b5cf6',
  LANGUAGE: '#10b981',
  VISUOSPATIAL: '#f59e0b',
  ORIENTATION: '#ef4444',
  SOCIAL_COGNITION: '#ec4899',
};

export default function SessionsScreen() {
  const patient = useAuthStore((s) => s.patient);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const { data: sessions = [], isLoading, refetch, isRefetching } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      try {
        const { data } = await api.get<Session[]>('/patient/sessions');
        await cacheSessions(data);
        return data;
      } catch {
        return getCachedSessions();
      }
    },
  });

  const pending = sessions.filter((s) => s.status === 'PENDING' || s.status === 'IN_PROGRESS');
  const completed = sessions.filter((s) => s.status === 'COMPLETED' || s.status === 'EXPIRED');

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {patient?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Tus ejercicios cognitivos</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {sessions.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🧩</Text>
              <Text style={styles.emptyTitle}>Sin sesiones asignadas</Text>
              <Text style={styles.emptyDesc}>Tu profesional te enviará ejercicios próximamente.</Text>
            </View>
          )}

          {pending.length > 0 && (
            <View>
              <Text style={styles.sectionLabel}>Pendientes</Text>
              {pending.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onPress={() => router.push(`/session/${s.id}`)}
                />
              ))}
            </View>
          )}

          {completed.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionLabel}>Completadas</Text>
              {completed.map((s) => (
                <SessionCard key={s.id} session={s} onPress={null} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SessionCard({ session, onPress }: { session: Session; onPress: (() => void) | null }) {
  const completedCount = session.items.filter((it) => it.result).length;
  const areas = [...new Set(session.items.map((it) => it.exercise.cognitiveArea))];

  const dueMs = session.dueDate ? new Date(session.dueDate).getTime() - Date.now() : null;
  const dueDays = dueMs !== null ? Math.ceil(dueMs / 86_400_000) : null;

  const isCompleted = session.status === 'COMPLETED';
  const isExpired = session.status === 'EXPIRED';

  return (
    <View style={[styles.card, (isCompleted || isExpired) && styles.cardDone]}>
      {/* Area chips */}
      <View style={styles.chips}>
        {areas.slice(0, 3).map((area) => (
          <View key={area} style={[styles.chip, { backgroundColor: (AREA_COLOR[area] ?? '#6366f1') + '20' }]}>
            <Text style={[styles.chipText, { color: AREA_COLOR[area] ?? '#6366f1' }]}>
              {AREA_LABEL[area] ?? area}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.cardTitle}>
        {session.items.length} ejercicio{session.items.length !== 1 ? 's' : ''}
        {completedCount > 0 && !isCompleted && (
          <Text style={styles.progressText}>  ({completedCount} hechos)</Text>
        )}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDate}>
          {new Date(session.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          {dueDays !== null && (
            <Text style={{ color: dueDays < 0 ? '#ef4444' : dueDays <= 2 ? '#f59e0b' : '#6b7280' }}>
              {dueDays < 0
                ? `  ⚠️ Vencida`
                : dueDays <= 2
                ? `  ⏰ ${dueDays}d`
                : `  📅 ${new Date(session.dueDate!).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
            </Text>
          )}
        </Text>

        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.playBtn} activeOpacity={0.8}>
            <Text style={styles.playBtnText}>
              {completedCount > 0 ? 'Continuar ▶' : 'Empezar ▶'}
            </Text>
          </TouchableOpacity>
        )}
        {isCompleted && (
          <View style={styles.doneChip}>
            <Text style={styles.doneChipText}>✓ Completada</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subGreeting: { fontSize: 13, color: '#c7d2fe', marginTop: 2 },
  logoutBtn: { backgroundColor: '#ffffff20', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#e0e7ff', fontSize: 13, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDone: { opacity: 0.7 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '600' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  progressText: { fontSize: 13, fontWeight: '400', color: '#10b981' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  cardDate: { fontSize: 12, color: '#9ca3af', flex: 1 },
  playBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  playBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  doneChip: { backgroundColor: '#f0fdf4', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  doneChipText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
});
