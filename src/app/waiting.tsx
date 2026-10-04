import { useCallback, useState } from 'react';
import { Redirect, router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useAuth } from '@/lib/auth';
import { formatEventTime, getMyInvites, type MyInvite } from '@/lib/events';
import { colors, fontWeight, radius, spacing } from '@/theme';

function nextSunday9am(): Date {
  const now = new Date();
  const d = new Date(now);
  const days = (7 - now.getDay()) % 7;
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7);
  return d;
}

export default function Home() {
  const { session, profile, signOut } = useAuth();
  const [invites, setInvites] = useState<MyInvite[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      setInvites(await getMyInvites(session.user.id));
    } catch {
      setInvites([]);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/onboarding" />;

  const active = (invites ?? []).filter((i) => i.myStatus !== 'declined');
  const dropText = nextSunday9am().toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {invites === null ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(6) }} />
        ) : active.length > 0 ? (
          <>
            <Text style={styles.heading}>Your invites</Text>
            {active.map((inv) => (
              <Pressable key={inv.event.id} onPress={() => router.push(`/event/${inv.event.id}`)}>
                <Card style={{ marginBottom: spacing(1.5) }}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{inv.event.title}</Text>
                    <View style={[styles.badge, inv.event.status === 'confirmed' ? styles.badgeConfirmed : styles.badgePending]}>
                      <Text style={styles.badgeText}>{inv.event.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>{inv.event.venue_name}</Text>
                  <Text style={styles.cardMeta}>{formatEventTime(inv.event.starts_at)}</Text>
                  <Text style={styles.counter}>
                    {inv.confirmedCount} of {inv.event.min_attendees} confirmed
                    {inv.myStatus === 'confirmed' ? "  ·  you're in" : ''}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.badgeInline}>You're in</Text>
            <Text style={styles.heading}>Your week's plans arrive Sunday morning</Text>
            <Text style={styles.drop}>Next drop: {dropText}</Text>
            <Text style={styles.muted}>
              We'll match you into a small group near you and send an invite. No
              planning on your end.
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing(3), flexGrow: 1 },
  heading: { fontSize: 26, fontWeight: fontWeight.heading, color: colors.text, marginBottom: spacing(2) },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 18, fontWeight: fontWeight.heading, color: colors.text, flex: 1, marginRight: spacing(1) },
  cardMeta: { fontSize: 14, color: colors.textMuted, marginTop: spacing(0.5) },
  counter: { fontSize: 14, color: colors.primary, fontWeight: fontWeight.heading, marginTop: spacing(1) },
  badge: { paddingHorizontal: spacing(1), paddingVertical: spacing(0.25), borderRadius: radius.chip },
  badgePending: { backgroundColor: colors.pending },
  badgeConfirmed: { backgroundColor: colors.confirmed },
  badgeText: { fontSize: 12, fontWeight: fontWeight.heading, color: colors.text },
  waiting: { flex: 1, justifyContent: 'center' },
  badgeInline: {
    alignSelf: 'flex-start',
    backgroundColor: colors.confirmed,
    color: colors.success,
    fontWeight: fontWeight.heading,
    fontSize: 13,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing(2),
  },
  drop: { fontSize: 17, color: colors.primary, fontWeight: fontWeight.heading, marginVertical: spacing(1.5) },
  muted: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  footer: { padding: spacing(3) },
});
