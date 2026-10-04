// Gather design system — single source of truth for UI tokens.
// Font is intentionally omitted: React Native uses the platform system
// font by default (San Francisco on iOS, Roboto on Android).

export const colors = {
  background: '#FAF7F2', // warm cream
  surface: '#FFFFFF',
  primary: '#B05C34', // warm terracotta — action buttons / brand accent
  success: '#4A7C59', // sage green — confirmed / "you're in" states
  text: '#2B2A27', // warm charcoal
  textMuted: '#8A857C', // warm grey
  pending: '#E7E3DC', // warm grey chip
  confirmed: '#DCEAD9', // soft sage chip
  border: '#ECE7DF', // warm border
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

// Soft, gentle elevation (Flock-style). Works on iOS/Android/web via RN style.
export const shadow = {
  shadowColor: '#2B2A27',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 2,
} as const;

export const theme = { colors, spacing, radius, fontWeight, shadow };

export type Theme = typeof theme;
