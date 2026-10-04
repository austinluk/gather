import { getActivity } from '../data/activities';
import { getArea } from '../data/areas';
import { env } from '../lib/env';
import type { Venue, VenueAdapter } from './types';

// Real venues via Google Places (legacy Nearby Search). Only used when
// USE_MOCK_VENUES=false. UNTESTED against a live key — requires the Places API
// to be enabled on the key. Falls back to returning null on any failure so the
// caller can drop the event rather than crash.
interface PlacesResult {
  place_id: string;
  name: string;
  vicinity?: string;
  rating?: number;
  business_status?: string;
  geometry?: { location?: { lat: number; lng: number } };
}

export const googlePlacesAdapter: VenueAdapter = {
  async find(activityId: string, areaId: string): Promise<Venue | null> {
    const area = getArea(areaId);
    const activity = getActivity(activityId);
    if (!area || !activity || !env.GOOGLE_PLACES_API_KEY) return null;

    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    );
    url.searchParams.set('location', `${area.lat},${area.lng}`);
    url.searchParams.set('radius', '5000');
    url.searchParams.set('keyword', activity.venueQuery);
    url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);

    try {
      const res = await fetch(url);
      const data = (await res.json()) as { results?: PlacesResult[] };
      const results = (data.results ?? [])
        .filter((p) => p.business_status === 'OPERATIONAL' && (p.rating ?? 0) >= 4.0)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      const best = results[0] ?? data.results?.[0];
      if (!best) return null;
      return {
        provider: 'google_places',
        providerId: best.place_id,
        name: best.name,
        address: best.vicinity ?? `${area.label}, Vancouver, BC`,
        lat: best.geometry?.location?.lat ?? area.lat,
        lng: best.geometry?.location?.lng ?? area.lng,
      };
    } catch (err) {
      console.warn('[venues] google places lookup failed:', err);
      return null;
    }
  },
};
