import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (session) return <Redirect href="/" />;

  async function signIn() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) setError(error.message);
    else if (!data.session) {
      setNotice('Account created. If email confirmation is on, confirm your email then sign in.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Gather</Text>
        <Text style={styles.tagline}>find your people in Vancouver 🌼</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrap}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>AI-made events that bring strangers together.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={colors.textMuted}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Button label="Sign in" onPress={signIn} loading={loading} style={{ marginTop: spacing(1) }} />
          <Button label="Create account" variant="ghost" onPress={signUp} disabled={loading} />
          <Button label="Open demo panel" variant="ghost" onPress={() => router.push('/demo')} disabled={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: {
    backgroundColor: colors.hero,
    paddingTop: 96,
    paddingBottom: spacing(5),
    paddingHorizontal: spacing(3),
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  wordmark: { fontFamily: fonts.script, fontSize: 72, color: colors.heroText, lineHeight: 78 },
  tagline: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.heroText },
  formWrap: { flex: 1 },
  form: { padding: spacing(3), paddingTop: spacing(4) },
  lead: {
    fontFamily: fonts.headingSemi,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(3),
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.75),
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  error: { color: '#B00020', marginBottom: spacing(1), fontFamily: fonts.body },
  notice: { color: colors.textMuted, marginBottom: spacing(1), fontFamily: fonts.body },
});
