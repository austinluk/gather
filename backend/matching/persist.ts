import { getActivity } from '../data/activities';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { venueAdapter } from '../venues';
import type { RawGroup } from '../ai/gemini';
import { resolveSlotTime } from './slotTime';

export interface CreatedEvent {
  id: string;
  title: string;
  venue_name: string;
  area: string;
  starts_at: string;
  memberCount: number;
}

export interface PersistOutcome {
  created?: CreatedEvent;
  droppedReason?: string;
}

// Attach a venue and persist one validated group as a pending event + invited
// attendees. Happy-path: no DB transaction yet (Sprint 7); on a partial failure
// we best-effort delete the event so we don't leave an event with no attendees.
export async function persistGroup(
  group: RawGroup,
  slotId: string,
  minAttendees: number,
): Promise<PersistOutcome> {
  const activity = getActivity(group.activityId);
  if (!activity) return { droppedReason: 'unknown activity' };

  const time = resolveSlotTime(slotId, activity.durationMinutes);
  if (!time) return { droppedReason: 'unknown slot' };

  const venue = await venueAdapter.find(group.activityId, group.areaId);
  if (!venue) return { droppedReason: 'no suitable venue' };

  const { data: event, error } = await supabaseAdmin
    .from('events')
    .insert({
      title: group.title,
      description: group.description,
      activity_id: group.activityId,
      slot_id: slotId,
      area: group.areaId,
      starts_at: time.startsAt.toISOString(),
      ends_at: time.endsAt.toISOString(),
      rsvp_deadline_at: time.startsAt.toISOString(), // RSVP open until the event starts
      venue_provider: venue.provider,
      venue_provider_id: venue.providerId,
      venue_name: venue.name,
      venue_address: venue.address,
      venue_lat: venue.lat,
      venue_lng: venue.lng,
      min_attendees: minAttendees,
      max_attendees: group.memberIds.length,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !event) {
    return { droppedReason: `event insert failed: ${error?.message ?? 'no row'}` };
  }

  const rows = group.memberIds.map((uid) => ({
    event_id: event.id,
    user_id: uid,
    status: 'invited',
  }));
  const { error: attErr } = await supabaseAdmin.from('event_attendees').insert(rows);
  if (attErr) {
    await supabaseAdmin.from('events').delete().eq('id', event.id);
    return { droppedReason: `attendee insert failed: ${attErr.message}` };
  }

  return {
    created: {
      id: event.id,
      title: group.title,
      venue_name: venue.name,
      area: group.areaId,
      starts_at: time.startsAt.toISOString(),
      memberCount: group.memberIds.length,
    },
  };
}
