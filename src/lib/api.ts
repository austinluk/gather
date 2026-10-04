// Calls to the Gather backend (privileged writes the app can't do directly).

const BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export interface RsvpResult {
  ok: boolean;
  myStatus: 'confirmed' | 'declined';
  confirmedCount: number;
  eventStatus: 'pending' | 'confirmed' | 'cancelled';
  minAttendees: number;
}

export async function rsvp(
  eventId: string,
  userId: string,
  action: 'accept' | 'decline',
): Promise<RsvpResult> {
  const res = await fetch(`${BASE}/rsvp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, userId, action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? 'RSVP failed');
  return json as RsvpResult;
}
