import { useCallback, useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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
import { dark, fonts, spacing } from '@/theme';

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

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
      // ignore network errors — the screen stays on its last state
    } finally {
      setLoaded(true);
    }
  }, [id, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`event-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_attendees', filter: `event_id=eq.${id}` },
        () => refresh(),
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
        <ActivityIndicator color={dark.accent} size="large" />
      </View>
    );
  }

  const deadlinePassed = new Date(event.rsvp_deadline_at).getTime() < Date.now();
  const canRsvp = event.status !== 'cancelled' && !deadlinePassed;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={28} color={dark.text} />
        </Pressable>

        <View
          style={[
            styles.badge,
            event.status === 'confirmed'
              ? styles.badgeConfirmed
              : event.status === 'cancelled'
                ? styles.badgeCancelled
                : styles.badgePending,
          ]}
        >
          <Text style={styles.badgeText}>{event.status}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.stats}>
          <Stat num={`${confirmed}`} label="GOING" />
          <Stat num={`${event.max_attendees}`} label="SPOTS" />
          <Stat num={`${event.min_attendees}`} label="TO LOCK" />
        </View>

        {event.description ? (
          <>
            <Text style={styles.sectionLabel}>INFO</Text>
            <Text style={styles.description}>{event.description}</Text>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>WHERE</Text>
        <Text style={styles.value}>{event.venue_name}</Text>
        {event.venue_address ? <Text style={styles.valueMuted}>{event.venue_address}</Text> : null}

        <Text style={styles.sectionLabel}>WHEN</Text>
        <Text style={styles.value}>{formatEventTime(event.starts_at)}</Text>

        {attendees.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>WHO&apos;S GOING</Text>
            {attendees.map((a, i) => (
              <View key={i} style={styles.whoRow}>
                <View style={styles.whoAvatar}>
                  <Text style={styles.whoInitial}>{(a.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.whoName}>{a.name}</Text>
                <Text
                  style={[
                    styles.whoStatus,
                    a.status === 'confirmed' && styles.whoConfirmed,
                    a.status === 'declined' && styles.whoDeclined,
                  ]}
                >
                  {a.status === 'confirmed' ? 'going' : a.status === 'declined' ? 'declined' : 'invited'}
                </Text>
              </View>
            ))}
          </>
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
            <Text style={styles.footerConfirmed}>You&apos;re in 🎉</Text>
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
  container: { flex: 1, backgroundColor: dark.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dark.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(3) },
  back: { marginBottom: spacing(2), alignSelf: 'flex-start' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999, marginBottom: spacing(1.5) },
  badgePending: { backgroundColor: dark.card2 },
  badgeConfirmed: { backgroundColor: '#2E4433' },
  badgeCancelled: { backgroundColor: '#4A2E2E' },
  badgeText: { fontSize: 12, fontFamily: fonts.bodyBold, color: dark.text },
  title: { fontSize: 34, fontFamily: fonts.heading, color: dark.text, lineHeight: 40 },
  stats: { flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(2.5) },
  stat: { flex: 1, backgroundColor: dark.card, borderRadius: 16, paddingVertical: spacing(2), alignItems: 'center' },
  statNum: { fontSize: 26, fontFamily: fonts.heading, color: dark.text },
  statLabel: { fontSize: 12, fontFamily: fonts.bodyBold, color: dark.muted, marginTop: spacing(0.5), letterSpacing: 0.5 },
  sectionLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: dark.muted, letterSpacing: 1, marginTop: spacing(3), marginBottom: spacing(1) },
  description: { fontSize: 16, fontFamily: fonts.body, color: dark.text, lineHeight: 24 },
  value: { fontSize: 16, fontFamily: fonts.bodyBold, color: dark.text },
  valueMuted: { fontSize: 14, fontFamily: fonts.body, color: dark.muted, marginTop: spacing(0.25) },
  whoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(0.75) },
  whoAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: dark.card2, alignItems: 'center', justifyContent: 'center', marginRight: spacing(1.5) },
  whoInitial: { fontSize: 15, fontFamily: fonts.bodyBold, color: dark.sage },
  whoName: { flex: 1, fontSize: 15, fontFamily: fonts.body, color: dark.text },
  whoStatus: { fontSize: 13, fontFamily: fonts.body, color: dark.muted },
  whoConfirmed: { color: dark.sage, fontFamily: fonts.bodyBold },
  whoDeclined: { color: dark.muted, textDecorationLine: 'line-through' },
  error: { color: '#FF8A80', fontFamily: fonts.body, marginTop: spacing(2) },
  footer: { padding: spacing(2.5), gap: spacing(1), borderTopWidth: 1, borderTopColor: dark.card },
  footerMuted: { textAlign: 'center', fontFamily: fonts.body, color: dark.muted },
  footerConfirmed: { textAlign: 'center', color: dark.sage, fontFamily: fonts.bodyBold, fontSize: 16, marginBottom: spacing(1) },
});
