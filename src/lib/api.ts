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

// ─── Demo panel helpers (talk to backend service-role endpoints) ──────────────

export interface DemoMember {
  name: string;
  status: 'invited' | 'confirmed' | 'declined';
}

export interface DemoEvent {
  id: string;
  title: string;
  venue_name: string | null;
  area: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  min_attendees: number;
  max_attendees: number;
  starts_at: string;
  confirmedCount: number;
  members: DemoMember[];
}

async function post(path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string })?.error ?? `${path} failed`);
  return json;
}

export function runMatch() {
  return post('/match/run');
}

export function demoAccept(eventId: string) {
  return post('/jobs/demo-accept', { eventId });
}

export function resetDemo() {
  return post('/jobs/reset-demo');
}

export async function demoState(): Promise<{ events: DemoEvent[] }> {
  const res = await fetch(`${BASE}/jobs/demo-state`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? 'demo-state failed');
  return json as { events: DemoEvent[] };
}

export interface Attendee {
  name: string;
  status: 'invited' | 'confirmed' | 'declined';
}

// Who's in a Gemini-created event. Returns [] if the backend is unreachable.
export async function eventAttendees(eventId: string): Promise<Attendee[]> {
  try {
    const res = await fetch(`${BASE}/events/${eventId}/attendees`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.attendees ?? []) as Attendee[];
  } catch {
    return [];
  }
}

