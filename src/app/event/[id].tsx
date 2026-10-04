import { useCallback, useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { rsvp, eventAttendees, type Attendee } from '@/lib/api';
import {
  formatEventTime,
  getConfirmedCount,
  getEvent,
  getMyStatus,
  type AttendeeStatus,
  type GatherEvent,
} from '@/lib/events';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { colors, fontWeight, radius, spacing } from '@/theme';

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, promptLogin } = useAuth();
  const [event, setEvent] = useState<GatherEvent | null>(null);
  const [confirmed, setConfirmed] = useState(0);
  const [myStatus, setMyStatus] = useState<AttendeeStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);

  const refresh = useCallback(async () => {
    if (!id || !session) return;
    try {
      const [ev, count, status, people] = await Promise.all([
        getEvent(id),
        getConfirmedCount(id),
        getMyStatus(id, session.user.id),
        eventAttendees(id),
      ]);
      setEvent(ev);
      setConfirmed(count);
      setMyStatus(status);
      setAttendees(people);
    } catch {
      // ignore network errors — the screen just stays on its last state
    } finally {
      setLoaded(true);
    }
  }, [id, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live spot counter: refetch on any attendee change for this event.
  // (Requires realtime enabled for event_attendees; harmless if not.)
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_attendees', filter: `event_id=eq.${id}` },
        () => {
          refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refresh]);

  async function act(action: 'accept' | 'decline') {
    if (!session) {
      promptLogin();
      return;
    }
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const r = await rsvp(id, session.user.id, action);
      setMyStatus(r.myStatus);
      setConfirmed(r.confirmedCount);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RSVP failed');
    }
    setBusy(false);
  }

  if (!loaded || !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const deadlinePassed = new Date(event.rsvp_deadline_at).getTime() < Date.now();
  const canRsvp = event.status !== 'cancelled' && !deadlinePassed;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: '', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, event.status === 'confirmed' ? styles.badgeConfirmed : event.status === 'cancelled' ? styles.badgeCancelled : styles.badgePending]}>
          <Text style={styles.badgeText}>{event.status}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        <View style={styles.row}>
          <Text style={styles.label}>Where</Text>
          <Text style={styles.value}>{event.venue_name}</Text>
        </View>
        {event.venue_address ? (
          <View style={styles.row}>
            <Text style={styles.label}> </Text>
            <Text style={styles.valueMuted}>{event.venue_address}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>When</Text>
          <Text style={styles.value}>{formatEventTime(event.starts_at)}</Text>
        </View>

        <View style={styles.counterBox}>
          <Text style={styles.counterNum}>
            {confirmed} of {event.min_attendees}
          </Text>
          <Text style={styles.counterLabel}>confirmed to lock this in</Text>
        </View>

        {attendees.length > 0 && (
          <View style={styles.whoBox}>
            <Text style={styles.whoTitle}>Who's going</Text>
            {attendees.map((a, i) => (
              <View key={i} style={styles.whoRow}>
                <View style={styles.whoAvatar}>
                  <Text style={styles.whoInitial}>{(a.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.whoName}>{a.name}</Text>
                <Text style={[styles.whoStatus, a.status === 'confirmed' && styles.whoConfirmed, a.status === 'declined' && styles.whoDeclined]}>
                  {a.status === 'confirmed' ? 'going' : a.status === 'declined' ? 'declined' : 'invited'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {event.status === 'cancelled' ? (
          <Text style={styles.footerMuted}>This event was cancelled — not enough people joined.</Text>
        ) : deadlinePassed ? (
          <Text style={styles.footerMuted}>RSVP window has closed.</Text>
        ) : myStatus === 'confirmed' ? (
          <>
            <Text style={styles.footerConfirmed}>You're in 🎉</Text>
            <Button label="Can't make it" variant="ghost" onPress={() => act('decline')} loading={busy} />
          </>
        ) : (
          <>
            <Button label="I'm in" onPress={() => act('accept')} loading={busy} disabled={!canRsvp} />
            <Button label="Can't make it" variant="ghost" onPress={() => act('decline')} disabled={busy} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: spacing(3) },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: radius.chip, marginBottom: spacing(2) },
  badgePending: { backgroundColor: colors.pending },
  badgeConfirmed: { backgroundColor: colors.confirmed },
  badgeCancelled: { backgroundColor: '#F3D8D8' },
  badgeText: { fontSize: 12, fontWeight: fontWeight.heading, color: colors.text },
  title: { fontSize: 28, fontWeight: fontWeight.heading, color: colors.text },
  description: { fontSize: 16, color: colors.textMuted, lineHeight: 23, marginTop: spacing(1) },
  row: { flexDirection: 'row', marginTop: spacing(2) },
  label: { width: 60, fontSize: 15, color: colors.textMuted },
  value: { flex: 1, fontSize: 15, color: colors.text, fontWeight: fontWeight.heading },
  valueMuted: { flex: 1, fontSize: 14, color: colors.textMuted },
  counterBox: {
    marginTop: spacing(4),
    padding: spacing(3),
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  counterNum: { fontSize: 36, fontWeight: fontWeight.heading, color: colors.primary },
  counterLabel: { fontSize: 14, color: colors.textMuted, marginTop: spacing(0.5) },
  error: { color: '#B00020', marginTop: spacing(2) },
  whoBox: {
    marginTop: spacing(3),
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing(2),
  },
  whoTitle: { fontSize: 15, fontWeight: fontWeight.heading, color: colors.text, marginBottom: spacing(1) },
  whoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(0.75) },
  whoAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.confirmed, alignItems: 'center', justifyContent: 'center', marginRight: spacing(1.5) },
  whoInitial: { fontSize: 14, fontWeight: fontWeight.heading, color: colors.success },
  whoName: { flex: 1, fontSize: 15, color: colors.text },
  whoStatus: { fontSize: 13, color: colors.textMuted },
  whoConfirmed: { color: colors.success, fontWeight: fontWeight.heading },
  whoDeclined: { color: colors.textMuted, textDecorationLine: 'line-through' },
  footer: { padding: spacing(3), gap: spacing(1) },
  footerMuted: { textAlign: 'center', color: colors.textMuted },
  footerConfirmed: { textAlign: 'center', color: colors.success, fontWeight: fontWeight.heading, fontSize: 16, marginBottom: spacing(1) },
});
