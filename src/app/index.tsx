import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontWeight, radius, spacing } from '@/theme';

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Gather</Text>
        <Text style={styles.subtitle}>
          AI-powered events that bring strangers together in Vancouver.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get started</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing(3),
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    fontWeight: fontWeight.heading,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  subtitle: {
    fontSize: 16,
    fontWeight: fontWeight.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing(4),
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing(1.75),
    paddingHorizontal: spacing(4),
    borderRadius: radius.card,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: fontWeight.heading,
  },
});
