import { env } from '../lib/env';
import { googlePlacesAdapter } from './googlePlacesAdapter';
import { mockVenueAdapter } from './mockAdapter';

export const venueAdapter = env.USE_MOCK_VENUES ? mockVenueAdapter : googlePlacesAdapter;

export type { Venue } from './types';
