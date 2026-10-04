import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontWeight, radius, spacing } from '@/theme';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(1.5),
    borderRadius: radius.chip,
    borderWidth: 1,
    marginRight: spacing(1),
    marginBottom: spacing(1),
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unselected: { backgroundColor: colors.surface, borderColor: colors.border },
  text: { fontSize: 14, color: colors.text, fontWeight: fontWeight.body },
  textSelected: { color: colors.surface, fontWeight: fontWeight.heading },
});
