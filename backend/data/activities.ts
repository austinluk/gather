// Curated activity catalog. Gemini chooses one of these per group; it may NOT
// invent activities outside this list. Each activity bounds group size and
// carries a venue search query used by the venue adapters (Sprint 4).

export interface Activity {
  id: string;
  title: string;
  description: string;
  interest: string; // primary interest this serves (matches users.interests)
  durationMinutes: number; // event end = slot start + this
  minSize: number;
  maxSize: number; // permissive cap; the group's size preference (small 3-4 / large 8-12) is the real driver
  venueQuery: string; // search term for Google Places / mock adapter
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'morning_hike',
    title: 'Morning Hike',
    description: 'A relaxed group hike along a local trail or beach.',
    interest: 'hiking',
    durationMinutes: 120,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'park OR trail OR beach',
  },
  {
    id: 'coffee_hangout',
    title: 'Coffee Hangout',
    description: 'Casual coffee and conversation at a cozy local cafe.',
    interest: 'coffee',
    durationMinutes: 90,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'cafe OR coffee shop',
  },
  {
    id: 'board_game_night',
    title: 'Board Game Night',
    description: 'Meet up for a few rounds of board games.',
    interest: 'board_games',
    durationMinutes: 150,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'board game cafe',
  },
  {
    id: 'gallery_walk',
    title: 'Gallery Walk',
    description: 'Wander a local art gallery together.',
    interest: 'art',
    durationMinutes: 90,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'art gallery',
  },
  {
    id: 'live_music',
    title: 'Live Music',
    description: 'Catch a set at a local live music spot.',
    interest: 'music',
    durationMinutes: 150,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'live music venue OR bar',
  },
  {
    id: 'group_run',
    title: 'Group Run',
    description: 'An easy-paced group run along the seawall or a park loop.',
    interest: 'running',
    durationMinutes: 60,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'seawall OR running track OR park',
  },
  {
    id: 'photo_walk',
    title: 'Photo Walk',
    description: 'A casual photography walk around a scenic spot.',
    interest: 'photography',
    durationMinutes: 120,
    minSize: 3,
    maxSize: 12,
    venueQuery: 'scenic viewpoint OR waterfront OR park',
  },
];

export const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id);

export function getActivity(id: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.id === id);
}
