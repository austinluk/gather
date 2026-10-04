import { getSlot } from '../data/slots';

export interface SlotTime {
  startsAt: Date;
  endsAt: Date;
}

const TZ = 'America/Vancouver';

function partsIn(instant: Date, opts: Intl.DateTimeFormatOptions): Record<string, string> {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour12: false, ...opts })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
}

// Offset in ms between Vancouver wall-clock and UTC at a given instant: (tz - utc).
function tzOffsetMs(instant: Date): number {
  const p = partsIn(instant, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const hour = p.hour === '24' ? 0 : Number(p.hour); // some engines emit '24' for midnight
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), hour, Number(p.minute), Number(p.second));
  return asUtc - instant.getTime();
}

// Convert a Vancouver wall-clock time to the correct absolute UTC instant,
// accounting for PST/PDT. Date.UTC normalizes day overflow (e.g. day 35).
function vancouverToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo, d, h, mi, 0);
  let utc = guess - tzOffsetMs(new Date(guess));
  utc = guess - tzOffsetMs(new Date(utc)); // refine once across any DST boundary
  return new Date(utc);
}

// Resolve a weekly slot id to concrete start/end timestamps for its next upcoming
// occurrence, anchored to America/Vancouver — independent of the server's clock.
export function resolveSlotTime(slotId: string, durationMinutes: number): SlotTime | null {
  const slot = getSlot(slotId);
  if (!slot) return null;

  const now = new Date();
  const p = partsIn(now, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const year = Number(p.year);
  const month = Number(p.month) - 1;
  const day = Number(p.day);
  const weekday = weekdayMap[p.weekday] ?? 0;

  const days = (slot.dayOfWeek - weekday + 7) % 7;
  let startsAt = vancouverToUtc(year, month, day + days, slot.startHour, 0);
  if (startsAt.getTime() <= now.getTime()) {
    startsAt = vancouverToUtc(year, month, day + days + 7, slot.startHour, 0);
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  return { startsAt, endsAt };
}
