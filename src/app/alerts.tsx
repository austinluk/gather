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

export default function Alerts() {
  const { session } = useAuth();
  const [invites, setInvites] = useState<MyInvite[] | null>(null);

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

  const items = invites ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notifications</Text>

        {invites === null ? null : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={40} color={dark.muted} />
            <Text style={styles.emptyText}>No new notifications</Text>
            <Text style={styles.emptySub}>When Gather matches you into an event, your invite shows up here.</Text>
          </View>
        ) : (
          items.map((inv) => (
            <Pressable key={inv.event.id} style={styles.notif} onPress={() => router.push(`/event/${inv.event.id}`)}>
              <View style={styles.icon}>
                <Text style={{ fontSize: 22 }}>{EMOJI[inv.event.activity_id] ?? '🎉'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>
                  {inv.event.status === 'confirmed' ? "You're confirmed for " : "You're invited to "}
                  <Text style={styles.bold}>{inv.event.title}</Text>
                </Text>
                <Text style={styles.notifBody} numberOfLines={2}>
                  {inv.event.venue_name} · {formatEventTime(inv.event.starts_at)} · {inv.confirmedCount}/{inv.event.min_attendees} going. You in?
                </Text>
              </View>
              {inv.myStatus === 'invited' && <View style={styles.dot} />}
            </Pressable>
          ))
        )}
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { padding: spacing(2.5), flexGrow: 1 },
  title: { fontFamily: fonts.heading, fontSize: 32, color: dark.text, marginTop: spacing(1), marginBottom: spacing(2) },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(1), paddingTop: spacing(10) },
  emptyText: { fontFamily: fonts.heading, fontSize: 20, color: dark.text, marginTop: spacing(1) },
  emptySub: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, textAlign: 'center', paddingHorizontal: spacing(4) },
  notif: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), backgroundColor: dark.card, borderRadius: 16, padding: spacing(1.75), marginBottom: spacing(1.5) },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: dark.card2, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontFamily: fonts.body, fontSize: 15, color: dark.text },
  bold: { fontFamily: fonts.bodyBold },
  notifBody: { fontFamily: fonts.body, fontSize: 13, color: dark.muted, marginTop: spacing(0.5) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: dark.accent },
});
