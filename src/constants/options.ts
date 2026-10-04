// Onboarding option lists for the app UI. These mirror the backend catalogs
// (backend/data/*.ts) but are duplicated here because the app and backend are
// separate codebases — the app must not import server-side code.

export interface Option {
  id: string;
  label: string;
}

export const INTERESTS: Option[] = [
  { id: 'hiking', label: 'Hiking' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'board_games', label: 'Board games' },
  { id: 'art', label: 'Art' },
  { id: 'music', label: 'Music' },
  { id: 'running', label: 'Running' },
  { id: 'photography', label: 'Photography' },
];

export const SLOTS: Option[] = [
  { id: 'fri_evening', label: 'Friday evening' },
  { id: 'sat_morning', label: 'Saturday morning' },
  { id: 'sat_afternoon', label: 'Saturday afternoon' },
  { id: 'sun_afternoon', label: 'Sunday afternoon' },
];

export const AREAS: Option[] = [
  { id: 'downtown', label: 'Downtown' },
  { id: 'kitsilano', label: 'Kitsilano' },
  { id: 'east_van', label: 'East Van' },
  { id: 'west_van', label: 'West Van' },
  { id: 'north_van', label: 'North Van' },
  { id: 'gastown', label: 'Gastown' },
  { id: 'yaletown', label: 'Yaletown' },
  { id: 'mount_pleasant', label: 'Mount Pleasant' },
  { id: 'richmond', label: 'Richmond' },
  { id: 'burnaby', label: 'Burnaby' },
  { id: 'surrey', label: 'Surrey' },
];

export const BUDGETS: { value: number; label: string }[] = [
  { value: 0, label: 'Free' },
  { value: 10, label: '$10' },
  { value: 20, label: '$20' },
  { value: 40, label: '$40+' },
];

export const GROUP_SIZES: { value: 'small' | 'large'; label: string }[] = [
  { value: 'small', label: 'Small (3-4)' },
  { value: 'large', label: 'Large (8-12)' },
];
