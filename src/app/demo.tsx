import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  demoAccept,
  demoState,
  resetDemo,
  runMatch,
  type DemoEvent,
} from '@/lib/api';
import { colors, fontWeight, radius, spacing } from '@/theme';

export default function Demo() {
  const [events, setEvents] = useState<DemoEvent[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const { events } = await demoState();
      setEvents(events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach backend — is it running on :3001?');
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    load();
    polling.current = setInterval(load, 3000); // live refresh
    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, [load]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
    setBusy(null);
  }

  // Simulate the scheduled "weekly drop": a short delay, then matching runs and
  // invites (in-app notifications) land for everyone matched.
  function scheduledDrop() {
    if (busy || countdown !== null) return;
    let n = 6;
    setCountdown(n);
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(iv);
        setCountdown(null);
        run('run', runMatch);
      } else {
        setCountdown(n);
      }
    }, 1000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Demo control</Text>
        <Text style={styles.subtitle}>Simulate the Sunday weekly drop — matching runs after a short delay and sends everyone their invite.</Text>

        <View style={styles.actions}>
          <Button
            label={countdown !== null ? `Plans drop in ${countdown}s…` : 'Run weekly drop'}
            onPress={scheduledDrop}
            loading={busy === 'run'}
            disabled={countdown !== null}
            style={{ flex: 1 }}
          />
          <Button label="Reset" variant="ghost" onPress={() => run('reset', resetDemo)} disabled={!!busy || countdown !== null} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {events === null ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(4) }} />
        ) : events.length === 0 ? (
          <Text style={styles.empty}>No events yet. Hit “Generate events”.</Text>
        ) : (
          events.map((ev) => (
            <Card key={ev.id} style={{ marginTop: spacing(1.5) }}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{ev.title}</Text>
                <View style={[styles.badge, ev.status === 'confirmed' ? styles.badgeConfirmed : ev.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending]}>
                  <Text style={styles.badgeText}>{ev.status}</Text>
                </View>
              </View>
              <Text style={styles.meta}>{ev.venue_name} · {ev.area}</Text>
              <Text style={styles.counter}>{ev.confirmedCount} of {ev.min_attendees} confirmed</Text>
              <View style={styles.members}>
                {ev.members.map((m, i) => (
                  <Text key={i} style={[styles.member, m.status === 'confirmed' && styles.memberConfirmed, m.status === 'declined' && styles.memberDeclined]}>
                    {m.status === 'confirmed' ? '● ' : m.status === 'declined' ? '✕ ' : '○ '}{m.name}
                  </Text>
                ))}
              </View>
              {ev.status === 'pending' ? (
                <Button
                  label="Someone joins →"
                  variant="ghost"
                  onPress={() => run(`accept-${ev.id}`, () => demoAccept(ev.id))}
                  disabled={!!busy}
                  style={{ marginTop: spacing(1) }}
                />
              ) : null}
            </Card>
          ))
        )}

        <Pressable onPress={() => router.back()} style={{ marginTop: spacing(3) }}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing(3) },
  title: { fontSize: 28, fontWeight: fontWeight.heading, color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: spacing(0.5), marginBottom: spacing(2) },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  error: { color: '#B00020', marginTop: spacing(2) },
  empty: { color: colors.textMuted, marginTop: spacing(4), textAlign: 'center' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: fontWeight.heading, color: colors.text, flex: 1, marginRight: spacing(1) },
  meta: { fontSize: 14, color: colors.textMuted, marginTop: spacing(0.5) },
  counter: { fontSize: 15, color: colors.primary, fontWeight: fontWeight.heading, marginTop: spacing(1) },
  members: { marginTop: spacing(1) },
  member: { fontSize: 14, color: colors.textMuted, marginTop: spacing(0.25) },
  memberConfirmed: { color: colors.success, fontWeight: fontWeight.heading },
  memberDeclined: { color: colors.textMuted, textDecorationLine: 'line-through' },
  badge: { paddingHorizontal: spacing(1), paddingVertical: spacing(0.25), borderRadius: radius.chip },
  badgePending: { backgroundColor: colors.pending },
  badgeConfirmed: { backgroundColor: colors.confirmed },
  badgeCancelled: { backgroundColor: '#F3D8D8' },
  badgeText: { fontSize: 12, fontWeight: fontWeight.heading, color: colors.text },
  back: { color: colors.primary, fontWeight: fontWeight.heading, textAlign: 'center' },
});
