export interface Venue {
  provider: 'mock' | 'google_places';
  providerId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface VenueAdapter {
  // Returns the best venue for an activity in an area, or null if none found.
  find(activityId: string, areaId: string): Promise<Venue | null>;
}
