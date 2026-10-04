// Group-size preference ranges. "small" = intimate 3-4; "large" = 8-12.
// The matcher forms groups of people who share a preference and bounds the group
// to the matching range. An event's min_attendees/max_attendees come from here.

export const GROUP_SIZES = {
  small: { min: 3, max: 4 },
  large: { min: 8, max: 12 },
} as const;

export type GroupSizePref = keyof typeof GROUP_SIZES;

export function getGroupSizeRange(pref: string) {
  return GROUP_SIZES[pref as GroupSizePref] ?? GROUP_SIZES.small;
}
