import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, spacing } from '@/theme';

// Flock-style auth overlay: shown when a guest attempts a gated action or taps
// Sign In / Get started. Closes itself via the auth listener in AuthProvider
// once a session exists.
export function LoginModal({
  visible,
  initialMode = 'login',
  onDismiss,
}: {
  visible: boolean;
  initialMode?: 'login' | 'signup';
  onDismiss: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Open in the requested mode each time the modal appears.
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setError(null);
      setNotice(null);
    }
  }, [visible, initialMode]);

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.close} onPress={onDismiss} hitSlop={10}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.title}>{mode === 'login' ? 'log in' : 'sign up'}</Text>

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

          <Pressable style={styles.submit} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitText}>{mode === 'login' ? 'Login' : 'Create account'}</Text>
            )}
          </Pressable>

          <View style={styles.divider} />

          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switch}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchAccent}>{mode === 'login' ? 'sign up' : 'log in'}</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,42,39,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing(3),
  },
  close: { position: 'absolute', top: spacing(2), right: spacing(2), zIndex: 1 },
  closeText: { fontSize: 18, color: colors.textMuted },
  title: {
    fontFamily: fonts.script,
    fontSize: 40,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing(2),
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: spacing(0.5) },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing(1.5),
  },
  error: { color: '#B00020', fontFamily: fonts.body, marginBottom: spacing(1) },
  notice: { color: colors.textMuted, fontFamily: fonts.body, marginBottom: spacing(1) },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing(1.75),
    alignItems: 'center',
    marginTop: spacing(0.5),
  },
  submitText: { color: colors.surface, fontFamily: fonts.bodyBold, fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing(2) },
  switch: { textAlign: 'center', fontFamily: fonts.body, color: colors.textMuted, fontSize: 14 },
  switchAccent: { fontFamily: fonts.bodyBold, color: colors.primary },
});
