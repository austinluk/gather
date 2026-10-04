import { useState } from 'react';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, spacing } from '@/theme';

export default function SignIn() {
  const { session } = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'login' | 'signup'>(params.mode === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // On successful auth the session is set -> leave this page for the app.
  if (session) return <Redirect href="/waiting" />;

  async function submit() {
    setLoading(true);
    setError(null);
    setNotice(null);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) setError(error.message);
      else if (!data.session) setNotice('Account created — if email confirmation is on, confirm then log in.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: '', headerBackTitle: 'Back', headerTintColor: colors.primary, headerStyle: { backgroundColor: colors.background } }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Log in to see your invites.' : 'Join to get matched into events near you.'}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.textMuted}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Button
            label={mode === 'login' ? 'Log in' : 'Create account'}
            onPress={submit}
            loading={loading}
            style={{ marginTop: spacing(2) }}
          />

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switch}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchAccent}>{mode === 'login' ? 'Sign up' : 'Log in'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing(3), paddingTop: spacing(2) },
  title: { fontFamily: fonts.heading, fontSize: 30, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, marginTop: spacing(0.5), marginBottom: spacing(3) },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: spacing(0.5) },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.75),
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  error: { color: '#B00020', fontFamily: fonts.body, marginBottom: spacing(1) },
  notice: { color: colors.textMuted, fontFamily: fonts.body, marginBottom: spacing(1) },
  switch: { marginTop: spacing(2.5), alignItems: 'center' },
  switchText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  switchAccent: { fontFamily: fonts.bodyBold, color: colors.primary },
});
