// Candidate meeting areas (Vancouver neighborhoods). This is the fixed set of
// area ids used in users.acceptable_areas and chosen by Gemini per group. The
// coordinates seed the venue search radius in Sprint 4.

export interface Area {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const AREAS: Area[] = [
  { id: 'downtown', label: 'Downtown', lat: 49.2827, lng: -123.1207 },
  { id: 'kitsilano', label: 'Kitsilano', lat: 49.2674, lng: -123.1681 },
  { id: 'east_van', label: 'East Vancouver', lat: 49.2734, lng: -123.0694 },
  { id: 'west_van', label: 'West Vancouver', lat: 49.3308, lng: -123.1794 },
  { id: 'north_van', label: 'North Vancouver', lat: 49.3198, lng: -123.0724 },
  { id: 'gastown', label: 'Gastown', lat: 49.2845, lng: -123.1083 },
  { id: 'yaletown', label: 'Yaletown', lat: 49.2749, lng: -123.1236 },
  { id: 'mount_pleasant', label: 'Mount Pleasant', lat: 49.2627, lng: -123.1017 },
  { id: 'richmond', label: 'Richmond', lat: 49.1666, lng: -123.1336 },
  { id: 'burnaby', label: 'Burnaby', lat: 49.2488, lng: -122.9805 },
  { id: 'surrey', label: 'Surrey', lat: 49.1913, lng: -122.849 },
];

export const AREA_IDS = AREAS.map((a) => a.id);

export function getArea(id: string): Area | undefined {
  return AREAS.find((a) => a.id === id);
}
