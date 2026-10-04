import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TabBar } from '@/components/TabBar';
import { useAuth } from '@/lib/auth';
import { formatEventTime, getMyInvites, type MyInvite } from '@/lib/events';
import { dark, fonts, spacing } from '@/theme';

const EMOJI: Record<string, string> = {
  morning_hike: '🥾', coffee_hangout: '☕', board_game_night: '🎲',
  gallery_walk: '🎨', live_music: '🎵', group_run: '🏃', photo_walk: '📷',
};

export default function Home() {
  const { session, profile } = useAuth();
  const [invites, setInvites] = useState<MyInvite[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const list = await getMyInvites(session.user.id);
      setInvites(list.filter((i) => i.myStatus !== 'declined'));
    } catch {
      setInvites([]);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const name = profile?.name || 'there';
  const newInvite = invites.find((i) => i.myStatus === 'invited');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.welcome}>
            Welcome back, <Text style={styles.name}>{name}</Text>
          </Text>
          <View style={styles.topIcons}>
            <Ionicons name="notifications-outline" size={24} color={dark.text} />
            <Ionicons name="bookmark-outline" size={24} color={dark.text} />
          </View>
        </View>

        {newInvite && !dismissed && (
          <Pressable style={styles.banner} onPress={() => router.push(`/event/${newInvite.event.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>👋 Hi {name}!</Text>
              <Text style={styles.bannerBody}>
                {newInvite.event.max_attendees} people are registered and interested — you&apos;re invited to {newInvite.event.title}. Tap to see who&apos;s going.
              </Text>
            </View>
            <Pressable onPress={() => setDismissed(true)} hitSlop={10}>
              <Ionicons name="close" size={20} color={dark.text} />
            </Pressable>
          </Pressable>
        )}

        <Text style={styles.section}>Your Gatherings</Text>
        {invites.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>You have no gatherings yet</Text>
            <Pressable style={styles.cta} onPress={() => router.replace('/explore')}>
              <Text style={styles.ctaText}>Find events to attend</Text>
            </Pressable>
          </View>
        ) : (
          invites.map((inv) => (
            <Pressable key={inv.event.id} style={styles.eventRow} onPress={() => router.push(`/event/${inv.event.id}`)}>
              <View style={styles.icon}>
                <Text style={{ fontSize: 24 }}>{EMOJI[inv.event.activity_id] ?? '🎉'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.evTitle} numberOfLines={1}>{inv.event.title}</Text>
                <Text style={styles.evMeta} numberOfLines={1}>{inv.event.venue_name} · {formatEventTime(inv.event.starts_at)}</Text>
                <Text style={[styles.evSpots, inv.event.status === 'confirmed' && { color: dark.sage }]}>
                  {inv.event.status === 'confirmed' ? 'confirmed · you’re in' : `${inv.confirmedCount}/${inv.event.min_attendees} confirmed`}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        <Text style={[styles.section, { marginTop: spacing(4) }]}>Community Events</Text>
        <View style={styles.card}>
          <Text style={styles.empty}>No upcoming events from your communities</Text>
          <Pressable style={styles.cta} onPress={() => router.replace('/explore')}>
            <Text style={styles.ctaText}>Explore more communities</Text>
          </Pressable>
        </View>
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(3) },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(1), marginBottom: spacing(3) },
  welcome: { fontFamily: fonts.heading, fontSize: 28, color: dark.text, flex: 1 },
  name: { color: dark.accent },
  topIcons: { flexDirection: 'row', gap: spacing(2) },
  section: { fontFamily: fonts.heading, fontSize: 24, color: dark.text, marginBottom: spacing(1.5) },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(1),
    backgroundColor: dark.accent,
    borderRadius: 16,
    padding: spacing(2),
    marginBottom: spacing(3),
  },
  bannerTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#FFFFFF' },
  bannerBody: { fontFamily: fonts.body, fontSize: 14, color: '#FFF2EC', marginTop: spacing(0.5), lineHeight: 20 },
  card: { backgroundColor: dark.card, borderRadius: 16, padding: spacing(2.5), alignItems: 'center' },
  empty: { fontFamily: fonts.body, fontSize: 15, color: dark.muted, marginBottom: spacing(2), textAlign: 'center' },
  cta: { backgroundColor: dark.accent, borderRadius: 999, paddingVertical: spacing(1.5), paddingHorizontal: spacing(3) },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#FFFFFF' },
  eventRow: { flexDirection: 'row', gap: spacing(1.5), backgroundColor: dark.card, borderRadius: 16, padding: spacing(1.75), marginBottom: spacing(1.5) },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: dark.card2, alignItems: 'center', justifyContent: 'center' },
  evTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: dark.text },
  evMeta: { fontFamily: fonts.body, fontSize: 13, color: dark.muted, marginTop: spacing(0.25) },
  evSpots: { fontFamily: fonts.bodyBold, fontSize: 13, color: dark.accent, marginTop: spacing(0.5) },
});
