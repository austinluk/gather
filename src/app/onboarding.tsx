import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AREAS, BUDGETS, GROUP_SIZES, SLOTS } from '@/constants/options';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { fonts, spacing } from '@/theme';

const DARK = '#1C1A18';
const CHIP = '#302C28';
const ORANGE = '#E8734A';
const LIGHT = '#E7E3DC';
const TEXT = '#F5F1EA';
const MUTED = '#B8B2A8';

// Rich interest set for the survey. The 7 ids that have a matching activity in
// the backend (hiking, running, coffee, board_games, art, music, photography)
// drive real AI matching; the rest are stored as preferences.
const INTEREST_CATEGORIES: { title: string; items: { id: string; label: string }[] }[] = [
  {
    title: 'Sports',
    items: [
      { id: 'soccer', label: 'Soccer' }, { id: 'basketball', label: 'Basketball' },
      { id: 'tennis', label: 'Tennis' }, { id: 'volleyball', label: 'Volleyball' },
      { id: 'badminton', label: 'Badminton' }, { id: 'table_tennis', label: 'Table Tennis' },
      { id: 'baseball', label: 'Baseball' }, { id: 'running', label: 'Running' },
      { id: 'cycling', label: 'Cycling' }, { id: 'swimming', label: 'Swimming' },
      { id: 'climbing', label: 'Climbing' }, { id: 'yoga', label: 'Yoga' },
    ],
  },
  {
    title: 'Outdoors',
    items: [
      { id: 'hiking', label: 'Hiking' }, { id: 'camping', label: 'Camping' },
      { id: 'kayaking', label: 'Kayaking' }, { id: 'skiing', label: 'Skiing' },
      { id: 'surfing', label: 'Surfing' }, { id: 'fishing', label: 'Fishing' },
      { id: 'gardening', label: 'Gardening' }, { id: 'birdwatching', label: 'Birdwatching' },
      { id: 'photography', label: 'Photography' }, { id: 'picnics', label: 'Picnics' },
      { id: 'stargazing', label: 'Stargazing' }, { id: 'beach', label: 'Beach Days' },
    ],
  },
  {
    title: 'Food & Drink',
    items: [
      { id: 'coffee', label: 'Coffee' }, { id: 'cocktails', label: 'Cocktails' },
      { id: 'wine', label: 'Wine' }, { id: 'craft_beer', label: 'Craft Beer' },
      { id: 'tea', label: 'Tea' }, { id: 'baking', label: 'Baking' },
      { id: 'bbq', label: 'BBQ' }, { id: 'brunch', label: 'Brunch' },
      { id: 'ramen', label: 'Ramen' }, { id: 'sushi', label: 'Sushi' },
      { id: 'dim_sum', label: 'Dim Sum' }, { id: 'street_food', label: 'Street Food' },
    ],
  },
  {
    title: 'Entertainment',
    items: [
      { id: 'movies', label: 'Movies' }, { id: 'tv_shows', label: 'TV Shows' },
      { id: 'gaming', label: 'Gaming' }, { id: 'music', label: 'Music' },
      { id: 'podcasts', label: 'Podcasts' }, { id: 'anime', label: 'Anime' },
      { id: 'comics', label: 'Comics' }, { id: 'art', label: 'Art' },
      { id: 'theater', label: 'Theater' }, { id: 'dance', label: 'Dance' },
      { id: 'karaoke', label: 'Karaoke' }, { id: 'live_music', label: 'Live Music' },
    ],
  },
  {
    title: 'Hobbies',
    items: [
      { id: 'board_games', label: 'Board Games' }, { id: 'reading', label: 'Reading' },
      { id: 'writing', label: 'Writing' }, { id: 'painting', label: 'Painting' },
      { id: 'pottery', label: 'Pottery' }, { id: 'chess', label: 'Chess' },
      { id: 'puzzles', label: 'Puzzles' }, { id: 'knitting', label: 'Knitting' },
      { id: 'journaling', label: 'Journaling' }, { id: 'languages', label: 'Languages' },
      { id: 'volunteering', label: 'Volunteering' }, { id: 'crafts', label: 'Crafts' },
    ],
  },
];
const GENDERS = ['Woman', 'Man', 'Prefer not to say', 'Other'];

const STEPS = [
  { title: 'About you', subtitle: 'Just the basics to set up your profile.' },
  { title: 'Select some hobbies that interest you', subtitle: 'This helps us match you with the right people.' },
  { title: 'When are you free?', subtitle: 'Pick the time slots that work for you.' },
  { title: 'Where would you meet?', subtitle: 'Neighborhoods, budget, and group size.' },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export default function Onboarding() {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [budget, setBudget] = useState(20);
  const [groupSize, setGroupSize] = useState<'small' | 'large'>('small');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/login" />;

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function finish() {
    if (!session) return;
    setSaving(true);
    setError(null);
    const base: Record<string, unknown> = {
      id: session.user.id,
      name: name.trim() || null,
      gender,
      interests,
      acceptable_areas: areas,
      selected_slots: slots,
      budget_cad: budget,
      group_size: groupSize,
    };
    let { error: err } = await supabase.from('users').upsert(base);
    // resilient: if the gender column hasn't been added yet, save without it
    if (err && /gender/i.test(err.message)) {
      const { gender: _omit, ...noGender } = base;
      ({ error: err } = await supabase.from('users').upsert(noGender));
    }
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    router.replace('/');
  }

  const isLast = step === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={() => (step > 0 ? setStep(step - 1) : router.back())} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{STEPS[step].title}</Text>
        <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>

        {step === 0 && (
          <View style={{ marginTop: spacing(2) }}>
            <Text style={styles.catTitle}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={MUTED}
              value={name}
              onChangeText={setName}
            />
            <Text style={[styles.catTitle, { marginTop: spacing(3) }]}>Gender</Text>
            <View style={styles.wrap}>
              {GENDERS.map((g) => (
                <Chip key={g} label={g} selected={gender === g} onPress={() => setGender(g)} />
              ))}
            </View>
          </View>
        )}

        {step === 1 &&
          INTEREST_CATEGORIES.map((cat) => (
            <View key={cat.title} style={{ marginTop: spacing(2.5) }}>
              <Text style={styles.catTitle}>{cat.title}</Text>
              <View style={styles.wrap}>
                {cat.items.map((it) => (
                  <Chip
                    key={it.id}
                    label={it.label}
                    selected={interests.includes(it.id)}
                    onPress={() => toggle(interests, setInterests, it.id)}
                  />
                ))}
              </View>
            </View>
          ))}

        {step === 2 && (
          <View style={styles.wrap}>
            {SLOTS.map((o) => (
              <Chip key={o.id} label={o.label} selected={slots.includes(o.id)} onPress={() => toggle(slots, setSlots, o.id)} />
            ))}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.catTitle}>Neighborhoods</Text>
            <View style={styles.wrap}>
              {AREAS.map((o) => (
                <Chip key={o.id} label={o.label} selected={areas.includes(o.id)} onPress={() => toggle(areas, setAreas, o.id)} />
              ))}
            </View>
            <Text style={[styles.catTitle, { marginTop: spacing(3) }]}>Budget per event</Text>
            <View style={styles.wrap}>
              {BUDGETS.map((b) => (
                <Chip key={b.value} label={b.label} selected={budget === b.value} onPress={() => setBudget(b.value)} />
              ))}
            </View>
            <Text style={[styles.catTitle, { marginTop: spacing(3) }]}>Group size</Text>
            <View style={styles.wrap}>
              {GROUP_SIZES.map((g) => (
                <Chip key={g.value} label={g.label} selected={groupSize === g.value} onPress={() => setGroupSize(g.value)} />
              ))}
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.continue, pressed && { opacity: 0.85 }]}
          onPress={() => (isLast ? finish() : setStep(step + 1))}
          disabled={saving}
        >
          <Text style={styles.continueText}>{isLast ? (saving ? 'Saving…' : 'Finish') : 'Continue'}</Text>
        </Pressable>
        <Pressable style={styles.later} onPress={finish} disabled={saving}>
          <Text style={styles.laterText}>Maybe later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },
  header: { paddingHorizontal: spacing(2), paddingTop: spacing(1) },
  back: { color: TEXT, fontSize: 40, lineHeight: 40 },
  content: { paddingHorizontal: spacing(3), paddingBottom: spacing(3) },
  title: { fontFamily: fonts.heading, fontSize: 32, color: TEXT, lineHeight: 38 },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: MUTED, marginTop: spacing(1), lineHeight: 22 },
  catTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: TEXT, marginBottom: spacing(1.5) },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
  chip: { backgroundColor: CHIP, borderRadius: 999, paddingHorizontal: spacing(2), paddingVertical: spacing(1.25) },
  chipSelected: { backgroundColor: ORANGE },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 15, color: TEXT },
  chipTextSelected: { color: '#FFFFFF' },
  input: {
    backgroundColor: CHIP,
    borderRadius: 14,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.75),
    fontSize: 16,
    fontFamily: fonts.body,
    color: TEXT,
  },
  error: { color: '#FF8A80', fontFamily: fonts.body, marginTop: spacing(2) },
  footer: { padding: spacing(3), gap: spacing(1.5) },
  continue: { backgroundColor: ORANGE, borderRadius: 999, paddingVertical: spacing(2), alignItems: 'center' },
  continueText: { fontFamily: fonts.bodyBold, fontSize: 18, color: '#FFFFFF' },
  later: { backgroundColor: LIGHT, borderRadius: 999, paddingVertical: spacing(2), alignItems: 'center' },
  laterText: { fontFamily: fonts.bodyBold, fontSize: 18, color: '#4A443E' },
});
