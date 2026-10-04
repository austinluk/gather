import { getActivity } from '../data/activities';
import { getArea } from '../data/areas';
import { env } from '../lib/env';
import type { Venue, VenueAdapter } from './types';

// Real venues via the Places API (New) Text Search. Used when USE_MOCK_VENUES=false.
// Returns null on failure so the caller can fall back to the mock adapter.
interface NewPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
}

export const googlePlacesAdapter: VenueAdapter = {
  async find(activityId: string, areaId: string): Promise<Venue | null> {
    const area = getArea(areaId);
    const activity = getActivity(activityId);
    if (!area || !activity || !env.GOOGLE_PLACES_API_KEY) return null;

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
        body: JSON.stringify({
          textQuery: `${activity.venueQuery} in ${area.label}, Vancouver`,
          maxResultCount: 10,
          locationBias: {
            circle: { center: { latitude: area.lat, longitude: area.lng }, radius: 5000 },
          },
        }),
      });
      const data = (await res.json()) as { places?: NewPlace[] };
      const places = (data.places ?? [])
        .filter((p) => (p.rating ?? 0) >= 4.0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      const best = places[0] ?? data.places?.[0];
      if (!best) return null;
      return {
        provider: 'google_places',
        providerId: best.id,
        name: best.displayName?.text ?? 'Local venue',
        address: best.formattedAddress ?? `${area.label}, Vancouver, BC`,
        lat: best.location?.latitude ?? area.lat,
        lng: best.location?.longitude ?? area.lng,
      };
    } catch (err) {
      console.warn('[venues] Places API (new) failed:', err);
      return null;
    }
  },
};
