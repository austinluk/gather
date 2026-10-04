import { env } from '../lib/env';
import { googlePlacesAdapter } from './googlePlacesAdapter';
import { mockVenueAdapter } from './mockAdapter';
import type { Venue } from './types';

export type { Venue } from './types';

// Pick a venue. With USE_MOCK_VENUES=true, deterministic mock. Otherwise try
// real Google Places and fall back to mock if it finds nothing (so an event is
// never dropped just because the venue lookup failed).
export async function findVenue(activityId: string, areaId: string): Promise<Venue | null> {
  if (env.USE_MOCK_VENUES) return mockVenueAdapter.find(activityId, areaId);
  const real = await googlePlacesAdapter.find(activityId, areaId);
  return real ?? mockVenueAdapter.find(activityId, areaId);
}
