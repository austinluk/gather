import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TabBar } from '@/components/TabBar';
import { demoState, type DemoEvent } from '@/lib/api';
import { formatEventTime } from '@/lib/events';
import { dark, fonts, spacing } from '@/theme';

export default function Events() {
  const [events, setEvents] = useState<DemoEvent[] | null>(null);

  const load = useCallback(async () => {
    try {
      const { events } = await demoState();
      setEvents(events);
    } catch {
      setEvents([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Gatherings</Text>
        <Text style={styles.sub}>Upcoming events across Vancouver</Text>

        {events === null ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : events.length === 0 ? (
          <Text style={styles.empty}>No gatherings yet — generate some from the demo panel.</Text>
        ) : (
          events.map((e) => (
            <View key={e.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.evTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.evMeta} numberOfLines={1}>{e.venue_name} · {e.area}</Text>
                <Text style={styles.evMeta}>{formatEventTime(e.starts_at)}</Text>
              </View>
              <View style={[styles.badge, e.status === 'confirmed' ? styles.bConfirmed : styles.bPending]}>
                <Text style={styles.badgeText}>{e.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { padding: spacing(2.5), paddingBottom: spacing(3) },
  title: { fontFamily: fonts.heading, fontSize: 32, color: dark.text, marginTop: spacing(1) },
  sub: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, marginBottom: spacing(3) },
  empty: { fontFamily: fonts.body, fontSize: 15, color: dark.muted, marginTop: spacing(4), textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: dark.card, borderRadius: 16, padding: spacing(2), marginBottom: spacing(1.5) },
  evTitle: { fontFamily: fonts.headingSemi, fontSize: 16, color: dark.text },
  evMeta: { fontFamily: fonts.body, fontSize: 13, color: dark.muted, marginTop: spacing(0.25) },
  badge: { paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.5), borderRadius: 999 },
  bPending: { backgroundColor: dark.card2 },
  bConfirmed: { backgroundColor: '#2E4433' },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: dark.text },
});
