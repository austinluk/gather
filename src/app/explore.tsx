import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TabBar } from '@/components/TabBar';
import { dark, fonts, spacing } from '@/theme';

const FEATURED = [
  { name: 'The Pickleball Club 🥒🎾', desc: "Let's play! A welcoming community for all levels.", bg: '#F3C98B' },
  { name: 'Girls in Van', desc: "the girls, gays + they's YEARN for community.", bg: '#E7C7A0' },
  { name: 'lumi social club', desc: 'Low-pressure activities and good vibes.', bg: '#C9D9A8' },
  { name: 'Actually Romantic', desc: 'IRL > dating apps. Experience-first hangs.', bg: '#E8B4B0' },
  { name: 'Mudflower', desc: 'For community. Because this is the whole point!', bg: '#E7A8C4' },
];
const EVENTS = [
  { title: 'snacks & ladders', emoji: '🎲', meta: 'Sat Oct 17 · East Van', bg: '#D7E3B0' },
  { title: 'Book Club', emoji: '📚', meta: 'Sat Nov 7 · Central Van', bg: '#E7D7C3' },
  { title: 'Board Game Night', emoji: '🎲', meta: 'Thu Oct 8 · Richmond', bg: '#C9C2B4' },
  { title: 'Seawall Social Run', emoji: '🏃', meta: 'Thu Oct 8 · Central Van', bg: '#CFE0D6' },
];
const COMMUNITIES = [
  { name: 'The Literary Flock', desc: 'A discussion based book club!', bg: '#D7E3B0' },
  { name: 'Chinatown Together 華埠團結', desc: 'Intergenerational community events.', bg: '#F3C98B' },
  { name: 'Park Pace', desc: 'Beginner friendly run club.', bg: '#CFE0D6' },
];

function Head({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        <Text style={styles.hTitle}>{title}</Text>
        <Text style={styles.hSub}>{subtitle}</Text>
      </View>
      <Text style={styles.viewAll}>View All</Text>
    </View>
  );
}

export default function Explore() {
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
        <Text style={styles.loc}>🏙️  Vancouver ▾</Text>
        <View style={styles.search}>
          <Text style={styles.searchText}>🔍  Search communities, events, meetups…</Text>
        </View>

        <View style={styles.section}>
          <Head title="Featured Communities" subtitle="We handpicked communities for you" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {FEATURED.map((c) => (
              <View key={c.name} style={styles.wide}>
                <View style={[styles.sq, { backgroundColor: c.bg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wideTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.wideDesc} numberOfLines={2}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Head title="Trending Events" subtitle="Popular events people are excited about" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {EVENTS.map((e) => (
              <View key={e.title} style={styles.ev}>
                <View style={[styles.evArt, { backgroundColor: e.bg }]}><Text style={{ fontSize: 44 }}>{e.emoji}</Text></View>
                <Text style={styles.evTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.evMeta} numberOfLines={1}>{e.meta}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Head title="Trending Communities" subtitle="Growing groups worth checking out" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {COMMUNITIES.map((c) => (
              <View key={c.name} style={styles.wide}>
                <View style={[styles.sq, { backgroundColor: c.bg }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.wideTitle} numberOfLines={1}>{c.name}</Text>
                  <Text style={styles.wideDesc} numberOfLines={2}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { paddingHorizontal: spacing(2.5), paddingBottom: spacing(3) },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(1) },
  explore: { fontFamily: fonts.heading, fontSize: 36, color: dark.text },
  plus: { fontSize: 32, color: dark.text, fontWeight: '300' },
  loc: { fontFamily: fonts.heading, fontSize: 20, color: dark.text, marginTop: spacing(1) },
  search: { backgroundColor: dark.card, borderRadius: 14, paddingHorizontal: spacing(2), paddingVertical: spacing(1.75), marginTop: spacing(2) },
  searchText: { fontFamily: fonts.body, fontSize: 15, color: dark.muted },
  section: { marginTop: spacing(4) },
  head: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing(2) },
  hTitle: { fontFamily: fonts.heading, fontSize: 26, color: dark.text },
  hSub: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, marginTop: spacing(0.25) },
  viewAll: { fontFamily: fonts.bodyBold, fontSize: 16, color: dark.accent },
  hRow: { gap: spacing(1.5), paddingRight: spacing(2) },
  wide: { width: 300, flexDirection: 'row', gap: spacing(1.5), backgroundColor: dark.card, borderRadius: 18, padding: spacing(1.75) },
  sq: { width: 56, height: 56, borderRadius: 14 },
  wideTitle: { fontFamily: fonts.heading, fontSize: 18, color: dark.text },
  wideDesc: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, marginTop: spacing(0.5) },
  ev: { width: 170 },
  evArt: { width: 170, height: 170, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  evTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: dark.text, marginTop: spacing(1) },
  evMeta: { fontFamily: fonts.body, fontSize: 13, color: dark.muted, marginTop: spacing(0.25) },
});
