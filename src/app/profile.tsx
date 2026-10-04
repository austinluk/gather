import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TabBar } from '@/components/TabBar';
import { useAuth } from '@/lib/auth';
import { getMyInvites } from '@/lib/events';
import { dark, fonts, spacing } from '@/theme';

export default function Profile() {
  const { session, profile, signOut } = useAuth();
  const [attended, setAttended] = useState(0);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const list = await getMyInvites(session.user.id);
      setAttended(list.filter((i) => i.myStatus === 'confirmed').length);
    } catch {
      setAttended(0);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Image source={require('../../assets/Logo_gather.jpg')} style={styles.pfp} />
          <Text style={styles.name}>{profile?.name || 'You'}</Text>
          {profile?.gender ? <Text style={styles.gender}>{profile.gender}</Text> : null}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{attended}</Text>
            <Text style={styles.statLabel}>Attended</Text>
          </View>
        </View>

        <Pressable style={styles.signout} onPress={signOut}>
          <Text style={styles.signoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: dark.bg },
  content: { padding: spacing(2.5), flexGrow: 1 },
  head: { alignItems: 'center', marginTop: spacing(3) },
  pfp: { width: 110, height: 110, borderRadius: 55, backgroundColor: dark.card },
  name: { fontFamily: fonts.heading, fontSize: 28, color: dark.text, marginTop: spacing(2) },
  gender: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, marginTop: spacing(0.5) },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dark.card,
    borderRadius: 18,
    paddingVertical: spacing(2.5),
    marginTop: spacing(4),
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: dark.card2 },
  statNum: { fontFamily: fonts.heading, fontSize: 28, color: dark.accent },
  statLabel: { fontFamily: fonts.body, fontSize: 14, color: dark.muted, marginTop: spacing(0.5) },
  signout: {
    marginTop: spacing(4),
    borderColor: dark.card2,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: spacing(1.75),
    alignItems: 'center',
  },
  signoutText: { fontFamily: fonts.bodyBold, fontSize: 16, color: dark.text },
});
