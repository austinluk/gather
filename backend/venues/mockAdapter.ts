import { getActivity } from '../data/activities';
import { getArea } from '../data/areas';
import type { Venue, VenueAdapter } from './types';

// Deterministic, offline, demo-safe venue generator. Never fails on stage.
const NOUNS: Record<string, string> = {
  morning_hike: 'Trailhead',
  coffee_hangout: 'Café',
  board_game_night: 'Game Café',
  gallery_walk: 'Gallery',
  live_music: 'Music Hall',
  group_run: 'Running Loop',
  photo_walk: 'Lookout',
};

export const mockVenueAdapter: VenueAdapter = {
  async find(activityId: string, areaId: string): Promise<Venue | null> {
    const area = getArea(areaId);
    const activity = getActivity(activityId);
    if (!area || !activity) return null;
    const noun = NOUNS[activityId] ?? 'Spot';
    return {
      provider: 'mock',
      providerId: `mock_${activityId}_${areaId}`,
      name: `${area.label} ${noun}`,
      address: `${area.label}, Vancouver, BC`,
      lat: area.lat,
      lng: area.lng,
    };
  },
};
