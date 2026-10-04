import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/lib/auth';
import { formatEventTime, getMyInvites, type MyInvite } from '@/lib/events';
import { fonts, spacing } from '@/theme';

// Dark "Explore" palette (matches the Flock reference).
const BG = '#151311';
const CARD = '#242019';
const CARD2 = '#2A251E';
const TEXT = '#F5F1EA';
const MUTED = '#A49E94';
const ORANGE = '#E8734A';
const SAGE = '#9CB36E';

// ── Static placeholders (no functionality, per request) ──────────────────────
const FEATURED = [
  { name: 'The Pickleball Club 🥒🎾', desc: "Let's play! A welcoming community for all levels.", bg: '#F3C98B' },
  { name: 'Girls in Van', desc: "the girls, gays + they's YEARN for community.", bg: '#E7C7A0' },
  { name: 'lumi social club', desc: 'Low-pressure activities and good vibes.', bg: '#C9D9A8' },
  { name: 'Actually Romantic', desc: 'IRL > dating apps. Experience-first hangs.', bg: '#E8B4B0' },
  { name: 'Mudflower', desc: 'For community. Because this is the whole point!', bg: '#E7A8C4' },
];
const TRENDING_EVENTS = [
  { title: 'snacks & ladders', emoji: '🎲', meta: 'Sat Oct 17 · East Van', bg: '#D7E3B0' },
  { title: 'Book Club', emoji: '📚', meta: 'Sat Nov 7 · Central Van', bg: '#E7D7C3' },
  { title: 'Board Game Night', emoji: '🎲', meta: 'Thu Oct 8 · Richmond', bg: '#C9C2B4' },
  { title: 'Seawall Social Run', emoji: '🏃', meta: 'Thu Oct 8 · Central Van', bg: '#CFE0D6' },
];
const TRENDING_COMMUNITIES = [
  { name: 'The Literary Flock', desc: 'A discussion based book club!', bg: '#D7E3B0' },
  { name: 'Chinatown Together 華埠團結', desc: 'Intergenerational community events.', bg: '#F3C98B' },
  { name: 'Park Pace', desc: 'Beginner friendly run club.', bg: '#CFE0D6' },
];

const EMOJI: Record<string, string> = {
  morning_hike: '🥾', coffee_hangout: '☕', board_game_night: '🎲',
  gallery_walk: '🎨', live_music: '🎵', group_run: '🏃', photo_walk: '📷',
};

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSub}>{subtitle}</Text>
      </View>
      <Text style={styles.viewAll}>View All</Text>
    </View>
  );
}

export default function Explore() {
  const { session, signOut } = useAuth();
  const [invites, setInvites] = useState<MyInvite[]>([]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Text style={styles.explore}>Explore</Text>
          <Pressable onPress={() => router.push('/demo')} hitSlop={10}>
            <Text style={styles.plus}>+</Text>
          </Pressable>
        </View>

        <View style={styles.locRow}>
          <Text style={styles.loc}>🏙️  Vancouver ▾</Text>
        </View>

        <View style={styles.search}>
          <Text style={styles.searchText}>🔍  Search communities, events, meetups…</Text>
        </View>

        {/* Real: the signed-in user's invites */}
        {invites.length > 0 && (
          <View style={styles.section}>
            <SectionHeaderReal title="Your Invites" subtitle="Events you've been matched into" />
            {invites.map((inv) => (
              <Pressable key={inv.event.id} style={styles.inviteCard} onPress={() => router.push(`/event/${inv.event.id}`)}>
                <View style={[styles.inviteIcon, { backgroundColor: '#3A342A' }]}>
                  <Text style={{ fontSize: 24 }}>{EMOJI[inv.event.activity_id] ?? '🎉'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteTitle} numberOfLines={1}>{inv.event.title}</Text>
                  <Text style={styles.inviteMeta} numberOfLines={1}>{inv.event.venue_name} · {formatEventTime(inv.event.starts_at)}</Text>
                  <Text style={[styles.inviteSpots, inv.event.status === 'confirmed' && { color: SAGE }]}>
                    {inv.event.status === 'confirmed' ? 'locked in' : `${inv.confirmedCount}/${inv.event.min_attendees} confirmed`}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Placeholder: Featured Communities */}
        <View style={styles.section}>
          <SectionHeader title="Featured Communities" subtitle="We handpicked communities for you" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {FEATURED.map((c) => (
              <View key={c.name} style={styles.wideCard}>
                <View style={[styles.sq, { backgroundColor: c.bg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wideTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.wideDesc} numberOfLines={2}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Placeholder: Trending Events */}
        <View style={styles.section}>
          <SectionHeader title="Trending Events" subtitle="Popular events people are excited about" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {TRENDING_EVENTS.map((e) => (
              <View key={e.title} style={styles.eventCard}>
                <View style={[styles.eventArt, { backgroundColor: e.bg }]}>
                  <Text style={{ fontSize: 44 }}>{e.emoji}</Text>
                </View>
                <Text style={styles.eventTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.eventMeta} numberOfLines={1}>{e.meta}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Placeholder: Trending Communities */}
        <View style={styles.section}>
          <SectionHeader title="Trending Communities" subtitle="Growing groups worth checking out" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {TRENDING_COMMUNITIES.map((c) => (
              <View key={c.name} style={styles.wideCard}>
                <View style={[styles.sq, { backgroundColor: c.bg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wideTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.wideDesc} numberOfLines={2}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Pressable onPress={signOut} style={{ alignSelf: 'center', marginTop: spacing(2) }}>
          <Text style={styles.signout}>Sign out</Text>
        </Pressable>
      </ScrollView>

      {/* Visual bottom tab bar (placeholder) */}
      <View style={styles.tabBar}>
        {['🏠', '🧭', '✈️', '🐦', '👤'].map((t, i) => (
          <Text key={i} style={[styles.tabIcon, i === 1 && styles.tabActive]}>{t}</Text>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Section header variant for the one real section (sage "View All"-less).
function SectionHeaderReal({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(4) },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(1) },
  explore: { fontFamily: fonts.heading, fontSize: 36, color: TEXT },
  plus: { fontSize: 32, color: TEXT, fontWeight: '300' },
  locRow: { marginTop: spacing(1) },
  loc: { fontFamily: fonts.heading, fontSize: 20, color: TEXT },
  search: { backgroundColor: CARD, borderRadius: 14, paddingHorizontal: spacing(2), paddingVertical: spacing(1.75), marginTop: spacing(2) },
  searchText: { fontFamily: fonts.body, fontSize: 15, color: MUTED },
  section: { marginTop: spacing(4) },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing(2) },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 26, color: TEXT },
  sectionSub: { fontFamily: fonts.body, fontSize: 14, color: MUTED, marginTop: spacing(0.25) },
  viewAll: { fontFamily: fonts.bodyBold, fontSize: 16, color: ORANGE },
  hRow: { gap: spacing(1.5), paddingRight: spacing(2) },
  wideCard: { width: 300, flexDirection: 'row', gap: spacing(1.5), backgroundColor: CARD, borderRadius: 18, padding: spacing(1.75) },
  sq: { width: 56, height: 56, borderRadius: 14 },
  wideTitle: { fontFamily: fonts.heading, fontSize: 18, color: TEXT },
  wideDesc: { fontFamily: fonts.body, fontSize: 14, color: MUTED, marginTop: spacing(0.5) },
  eventCard: { width: 170 },
  eventArt: { width: 170, height: 170, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: TEXT, marginTop: spacing(1) },
  eventMeta: { fontFamily: fonts.body, fontSize: 13, color: MUTED, marginTop: spacing(0.25) },
  inviteCard: { flexDirection: 'row', gap: spacing(1.5), backgroundColor: CARD2, borderRadius: 16, padding: spacing(1.75), marginBottom: spacing(1.5) },
  inviteIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  inviteTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: TEXT },
  inviteMeta: { fontFamily: fonts.body, fontSize: 13, color: MUTED, marginTop: spacing(0.25) },
  inviteSpots: { fontFamily: fonts.bodyBold, fontSize: 13, color: ORANGE, marginTop: spacing(0.5) },
  signout: { fontFamily: fonts.bodySemi, fontSize: 14, color: MUTED },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing(1.5),
    borderTopWidth: 1,
    borderTopColor: '#2A251E',
    backgroundColor: BG,
  },
  tabIcon: { fontSize: 22, opacity: 0.5 },
  tabActive: { opacity: 1 },
});
