import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { colors, fontWeight, spacing } from '@/theme';

// Next Sunday 09:00 in the device's local time. NOTE: the real matching cadence
// is Sunday 9am America/Vancouver (enforced server-side); this display uses local
// time for simplicity.
function nextSunday9am(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setHours(9, 0, 0, 0);
  let days = (7 - now.getDay()) % 7; // 0 = Sunday
  if (days === 0 && now.getTime() >= d.getTime()) days = 7;
  d.setDate(d.getDate() + days);
  return d;
}

export default function Waiting() {
  const { session, profile, signOut } = useAuth();

  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/onboarding" />;

  const drop = nextSunday9am();
  const dropText = drop.toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.badge}>You're in</Text>
        <Text style={styles.title}>Your week's plans arrive Sunday morning</Text>
        <Text style={styles.drop}>Next drop: {dropText}</Text>
        <Text style={styles.muted}>
          We'll match you into a small group near you and send an invite. No
          planning on your end — just show up.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.confirmed,
    color: colors.primary,
    fontWeight: fontWeight.heading,
    fontSize: 13,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.5),
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing(2),
  },
  title: {
    fontSize: 30,
    fontWeight: fontWeight.heading,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  drop: {
    fontSize: 17,
    color: colors.primary,
    fontWeight: fontWeight.heading,
    marginBottom: spacing(2),
  },
  muted: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  footer: { padding: spacing(3) },
});
