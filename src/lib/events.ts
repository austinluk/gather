import { supabase } from './supabase';

export interface GatherEvent {
  id: string;
  title: string;
  description: string | null;
  activity_id: string;
  area: string;
  starts_at: string;
  ends_at: string;
  rsvp_deadline_at: string;
  venue_name: string | null;
  venue_address: string | null;
  min_attendees: number;
  max_attendees: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export type AttendeeStatus = 'invited' | 'confirmed' | 'declined';

export interface MyInvite {
  myStatus: AttendeeStatus;
  confirmedCount: number;
  event: GatherEvent;
}

export async function getConfirmedCount(eventId: string): Promise<number> {
  const { count } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');
  return count ?? 0;
}

// The signed-in user's events (RLS restricts this to events they're a member of).
export async function getMyInvites(userId: string): Promise<MyInvite[]> {
  const { data, error } = await supabase
    .from('event_attendees')
    .select('status, events(*)')
    .eq('user_id', userId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    status: AttendeeStatus;
    events: GatherEvent | null;
  }[];

  const invites: MyInvite[] = [];
  for (const r of rows) {
    if (!r.events || r.events.status === 'cancelled') continue;
    invites.push({
      myStatus: r.status,
      confirmedCount: await getConfirmedCount(r.events.id),
      event: r.events,
    });
  }
  return invites;
}

export async function getEvent(eventId: string): Promise<GatherEvent | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();
  return (data as GatherEvent | null) ?? null;
}

export async function getMyStatus(
  eventId: string,
  userId: string,
): Promise<AttendeeStatus | null> {
  const { data } = await supabase
    .from('event_attendees')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  return ((data as { status: AttendeeStatus } | null)?.status) ?? null;
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
