import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'offline:sessions';
const PENDING_RESULTS_KEY = 'offline:pendingResults';

export interface CachedSession {
  id: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  items: Array<{
    id: string;
    level: number;
    exercise: { slug: string; title: string; cognitiveArea: string };
    result: { hits: number; errors: number } | null;
  }>;
}

export interface PendingResult {
  sessionItemId: string;
  hits: number;
  errors: number;
  reactionTimeMs: number | null;
  rawData: Record<string, unknown>;
  timestamp: number;
}

export async function cacheSessions(sessions: CachedSession[]) {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export async function getCachedSessions(): Promise<CachedSession[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  return raw ? (JSON.parse(raw) as CachedSession[]) : [];
}

export async function queueResult(result: PendingResult) {
  const raw = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
  const pending: PendingResult[] = raw ? (JSON.parse(raw) as PendingResult[]) : [];
  pending.push(result);
  await AsyncStorage.setItem(PENDING_RESULTS_KEY, JSON.stringify(pending));
}

export async function getPendingResults(): Promise<PendingResult[]> {
  const raw = await AsyncStorage.getItem(PENDING_RESULTS_KEY);
  return raw ? (JSON.parse(raw) as PendingResult[]) : [];
}

export async function clearPendingResults() {
  await AsyncStorage.removeItem(PENDING_RESULTS_KEY);
}
