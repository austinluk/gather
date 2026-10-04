import { getSlot } from '../data/slots';

export interface SlotTime {
  startsAt: Date;
  endsAt: Date;
}

// Resolve a weekly slot id to concrete start/end timestamps for its NEXT
// upcoming occurrence. NOTE: computed in server-local time (approximation of
// America/Vancouver); the exact-tz cutoff is a Sprint 6 concern.
export function resolveSlotTime(
  slotId: string,
  durationMinutes: number,
): SlotTime | null {
  const slot = getSlot(slotId);
  if (!slot) return null;

  const now = new Date();
  const d = new Date(now);
  const days = (slot.dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + days);
  d.setHours(slot.startHour, 0, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 7); // today but already past

  const startsAt = d;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return { startsAt, endsAt };
}
