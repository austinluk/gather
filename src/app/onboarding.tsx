import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { AREAS, BUDGETS, GROUP_SIZES, INTERESTS, SLOTS } from '@/constants/options';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts, spacing } from '@/theme';

export default function Onboarding() {
  const { session, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(20);
  const [groupSize, setGroupSize] = useState<'small' | 'large'>('small');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/login" />;

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const valid =
    name.trim().length > 0 &&
    interests.length > 0 &&
    slots.length > 0 &&
    areas.length > 0;

  async function submit() {
    if (!valid || !session) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('users').upsert({
      id: session.user.id,
      name: name.trim(),
      interests,
      acceptable_areas: areas,
      selected_slots: slots,
      budget_cad: budget,
      group_size: groupSize,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.replace('/waiting');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tell us about you</Text>
        <Text style={styles.subtitle}>
          We use this to match you with the right people and plans.
        </Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="First name"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Interests</Text>
        <View style={styles.chips}>
          {INTERESTS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={interests.includes(o.id)}
              onPress={() => toggle(interests, setInterests, o.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>When are you free?</Text>
        <View style={styles.chips}>
          {SLOTS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={slots.includes(o.id)}
              onPress={() => toggle(slots, setSlots, o.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Neighborhoods you'd meet in</Text>
        <View style={styles.chips}>
          {AREAS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={areas.includes(o.id)}
              onPress={() => toggle(areas, setAreas, o.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Budget per event</Text>
        <View style={styles.chips}>
          {BUDGETS.map((b) => (
            <Chip
              key={b.value}
              label={b.label}
              selected={budget === b.value}
              onPress={() => setBudget(b.value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Group size</Text>
        <View style={styles.chips}>
          {GROUP_SIZES.map((g) => (
            <Chip
              key={g.value}
              label={g.label}
              selected={groupSize === g.value}
              onPress={() => setGroupSize(g.value)}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Done"
          onPress={submit}
          disabled={!valid}
          loading={saving}
          style={{ marginTop: spacing(3) }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing(3) },
  title: { fontSize: 28, fontFamily: fonts.heading, color: colors.text },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.textMuted,
    marginTop: spacing(0.5),
    marginBottom: spacing(2),
  },
  label: {
    fontSize: 16,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginTop: spacing(2.5),
    marginBottom: spacing(1),
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: '#B00020', marginTop: spacing(2) },
});
