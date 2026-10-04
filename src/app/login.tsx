import { Redirect } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/lib/auth';
import { fonts, spacing } from '@/theme';

const DARK = '#211F1C';
const ORANGE = '#E8734A';
const MUTED = '#4A443E';

export default function Welcome() {
  const { session, promptLogin } = useAuth();

  // Already signed in -> straight to the app.
  if (session) return <Redirect href="/waiting" />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.art}>
          <Image
            source={require('../../assets/welcome.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Welcome to Gather!</Text>
          <Text style={styles.subtitle}>
            Your people are out there. Let&apos;s bring you together.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btn, { backgroundColor: ORANGE }, pressed && styles.pressed]}
            onPress={() => promptLogin('login')}
          >
            <Text style={styles.btnText}>Sign In</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btn, { backgroundColor: MUTED }, pressed && styles.pressed]}
            onPress={() => promptLogin('signup')}
          >
            <Text style={styles.btnText}>Get started</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  content: { flex: 1, paddingHorizontal: spacing(3), justifyContent: 'center' },
  art: { alignItems: 'center', marginBottom: spacing(4) },
  image: { width: 300, height: 300, borderRadius: 32, maxWidth: '100%' },
  copy: { marginBottom: spacing(4) },
  title: { fontFamily: fonts.heading, fontSize: 46, color: '#FFFFFF', lineHeight: 50 },
  subtitle: { fontFamily: fonts.bodySemi, fontSize: 18, color: '#E9E4DC', marginTop: spacing(1.5), lineHeight: 25 },
  actions: { flexDirection: 'row', gap: spacing(1.5) },
  btn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 18, color: '#FFFFFF' },
});
