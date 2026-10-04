// Gather design system — single source of truth for UI tokens.
// Font is intentionally omitted: React Native uses the platform system
// font by default (San Francisco on iOS, Roboto on Android).

export const colors = {
  background: '#FAF8F5', // warm off-white
  surface: '#FFFFFF',
  primary: '#2D6A4F', // deep green — action buttons
  text: '#1A1A1A',
  textMuted: '#888888',
  pending: '#E0E0E0', // grey chip
  confirmed: '#D8F3DC', // soft green chip
  border: '#EEECE8',
} as const;

// 8px base unit: spacing(1) = 8, spacing(2) = 16, spacing(3) = 24 ...
export const spacing = (units: number) => units * 8;

export const radius = {
  card: 12,
  chip: 8,
} as const;

export const fontWeight = {
  heading: '700',
  body: '400',
} as const;

export const theme = { colors, spacing, radius, fontWeight };

export type Theme = typeof theme;
