import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/lib/auth';
import { formatEventTime, getMyInvites, type MyInvite } from '@/lib/events';
import { colors, fonts, radius, shadow, spacing } from '@/theme';

const ACTIVITY_EMOJI: Record<string, string> = {
  morning_hike: '🥾',
  coffee_hangout: '☕',
  board_game_night: '🎲',
  gallery_walk: '🎨',
  live_music: '🎵',
  group_run: '🏃',
  photo_walk: '📷',
};

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
  const { session, signOut, promptLogin } = useAuth();
  const [invites, setInvites] = useState<MyInvite[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setInvites([]); // guest: nothing to fetch
      return;
    }
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

  const active = (invites ?? []).filter((i) => i.myStatus !== 'declined');
  const dropText = nextSunday9am().toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Actions that need an account prompt the login modal when browsing as a guest.
  function gated(fn: () => void) {
    if (!session) {
      promptLogin();
      return;
    }
    fn();
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Gather</Text>
        <Text style={styles.heroSub}>Vancouver 🌼</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {invites === null ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(6) }} />
        ) : active.length > 0 ? (
          <>
            <Text style={styles.heading}>Your invites</Text>
            <Text style={styles.subheading}>Tap one to see the plan and RSVP.</Text>
            {active.map((inv) => (
              <Pressable key={inv.event.id} onPress={() => router.push(`/event/${inv.event.id}`)}>
                <View style={styles.card}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.icon}>{ACTIVITY_EMOJI[inv.event.activity_id] ?? '🎉'}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{inv.event.title}</Text>
                      <View style={[styles.pill, inv.event.status === 'confirmed' ? styles.pillConfirmed : styles.pillPending]}>
                        <Text style={styles.pillText}>{inv.event.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.cardMeta}>{inv.event.venue_name}</Text>
                    <Text style={styles.cardMeta}>{formatEventTime(inv.event.starts_at)}</Text>
                    <Text style={styles.counter}>
                      {inv.confirmedCount} of {inv.event.min_attendees} confirmed
                      {inv.myStatus === 'confirmed' ? "  ·  you're in" : ''}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={styles.waiting}>
            <Text style={styles.waitingEmoji}>🗓️</Text>
            <Text style={styles.heading}>Your week's plans arrive Sunday</Text>
            <Text style={styles.drop}>Next drop: {dropText}</Text>
            <Text style={styles.muted}>
              We match you into a small group near you and send an invite. No planning on your end — just show up.
            </Text>
            <Pressable onPress={() => gated(() => router.push('/onboarding'))} style={styles.cta}>
              <Text style={styles.ctaText}>Set up your preferences →</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Pressable onPress={() => router.push('/demo')}>
            <Text style={styles.link}>Open demo panel</Text>
          </Pressable>
          {session ? (
            <Pressable onPress={signOut}>
              <Text style={styles.linkMuted}>Sign out</Text>
            </Pressable>
          ) : (
            <Pressable onPress={promptLogin}>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.hero,
    paddingTop: 72,
    paddingBottom: spacing(2.5),
    paddingHorizontal: spacing(3),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  wordmark: { fontFamily: fonts.script, fontSize: 44, color: colors.heroText, lineHeight: 48 },
  heroSub: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.heroText },
  content: { padding: spacing(3), flexGrow: 1 },
  heading: { fontFamily: fonts.heading, fontSize: 24, color: colors.text },
  subheading: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: spacing(0.25), marginBottom: spacing(2) },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing(1.5),
    marginBottom: spacing(1.5),
    ...shadow,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.confirmed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(1.5),
  },
  icon: { fontSize: 24 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontFamily: fonts.headingSemi, fontSize: 17, color: colors.text, flex: 1, marginRight: spacing(1) },
  cardMeta: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: spacing(0.25) },
  counter: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary, marginTop: spacing(1) },
  pill: { paddingHorizontal: spacing(1), paddingVertical: spacing(0.25), borderRadius: radius.chip },
  pillPending: { backgroundColor: colors.pending },
  pillConfirmed: { backgroundColor: colors.confirmed },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.text },
  waiting: { alignItems: 'center', paddingTop: spacing(5), paddingHorizontal: spacing(2) },
  waitingEmoji: { fontSize: 48, marginBottom: spacing(1) },
  drop: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primary, marginTop: spacing(1), marginBottom: spacing(1.5), textAlign: 'center' },
  muted: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, lineHeight: 22, textAlign: 'center' },
  cta: { marginTop: spacing(3) },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  footer: { marginTop: spacing(4), alignItems: 'center', gap: spacing(1.5) },
  link: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  linkMuted: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textMuted },
});
