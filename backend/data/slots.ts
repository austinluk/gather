// Fixed weekly availability slot menu. Replaces the old `slots` DB table — slots
// are the same every week, so they live in code. Users pick slot ids (stored in
// users.selected_slots); the matcher resolves each id to concrete start/end
// timestamps for the UPCOMING week at match time (America/Vancouver).

export interface Slot {
  id: string;
  label: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startHour: number; // 24h, America/Vancouver local
  endHour: number;
}

export const SLOTS: Slot[] = [
  { id: 'fri_evening', label: 'Friday evening', dayOfWeek: 5, startHour: 18, endHour: 20 },
  { id: 'sat_morning', label: 'Saturday morning', dayOfWeek: 6, startHour: 10, endHour: 12 },
  { id: 'sat_afternoon', label: 'Saturday afternoon', dayOfWeek: 6, startHour: 14, endHour: 16 },
  { id: 'sun_afternoon', label: 'Sunday afternoon', dayOfWeek: 0, startHour: 14, endHour: 16 },
];

export const SLOT_IDS = SLOTS.map((s) => s.id);

export function getSlot(id: string): Slot | undefined {
  return SLOTS.find((s) => s.id === id);
}
