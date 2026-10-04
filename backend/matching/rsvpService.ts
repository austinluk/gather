import { supabaseAdmin } from '../lib/supabaseAdmin';

export class RsvpError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
  }
}

export interface RsvpApplied {
  myStatus: 'confirmed' | 'declined';
  confirmedCount: number;
  eventStatus: 'pending' | 'confirmed' | 'cancelled';
  minAttendees: number;
}

// Core RSVP logic shared by the real RSVP route and the demo "someone joins"
// control. Verifies the invite, respects deadline/cancelled, is idempotent, and
// confirms the event once min_attendees accept. Throws RsvpError with an HTTP code.
export async function applyRsvp(
  eventId: string,
  userId: string,
  action: 'accept' | 'decline',
): Promise<RsvpApplied> {
  const { data: attendee, error: aErr } = await supabaseAdmin
    .from('event_attendees')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (aErr) throw aErr;
  if (!attendee) throw new RsvpError(404, 'no invitation for this user/event');

  const { data: event, error: eErr } = await supabaseAdmin
    .from('events')
    .select('id, status, min_attendees, rsvp_deadline_at')
    .eq('id', eventId)
    .single();
  if (eErr) throw eErr;
  if (event.status === 'cancelled') throw new RsvpError(409, 'event is cancelled');
  if (new Date(event.rsvp_deadline_at).getTime() < Date.now()) {
    throw new RsvpError(409, 'RSVP deadline has passed');
  }

  const newStatus = action === 'accept' ? 'confirmed' : 'declined';
  const { error: uErr } = await supabaseAdmin
    .from('event_attendees')
    .update({ status: newStatus })
    .eq('id', attendee.id);
  if (uErr) throw uErr;

  const { count, error: cErr } = await supabaseAdmin
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');
  if (cErr) throw cErr;
  const confirmedCount = count ?? 0;

  let eventStatus: RsvpApplied['eventStatus'] = event.status;
  if (action === 'accept' && event.status === 'pending' && confirmedCount >= event.min_attendees) {
    const { error: evErr } = await supabaseAdmin
      .from('events')
      .update({ status: 'confirmed' })
      .eq('id', eventId)
      .eq('status', 'pending');
    if (evErr) throw evErr;
    eventStatus = 'confirmed';
  }

  return { myStatus: newStatus, confirmedCount, eventStatus, minAttendees: event.min_attendees };
}
