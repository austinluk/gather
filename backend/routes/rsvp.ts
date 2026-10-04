import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export const rsvpRouter = Router();

// POST /rsvp  { eventId, userId, action: 'accept' | 'decline' }
// Server-side RSVP: verifies the invite belongs to the user, respects the
// deadline + cancelled state, is idempotent, and confirms the event once
// min_attendees accept.
//
// NOTE (happy-path auth): we trust the userId in the body so the demo can RSVP
// on behalf of seeded users who have no auth session. A production version would
// verify the caller's Supabase JWT instead.
rsvpRouter.post('/', async (req, res) => {
  const { eventId, userId, action } = req.body ?? {};
  if (!eventId || !userId || (action !== 'accept' && action !== 'decline')) {
    res.status(400).json({ error: 'eventId, userId, and action (accept|decline) are required' });
    return;
  }

  try {
    const { data: attendee, error: aErr } = await supabaseAdmin
      .from('event_attendees')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    if (aErr) throw aErr;
    if (!attendee) {
      res.status(404).json({ error: 'no invitation for this user/event' });
      return;
    }

    const { data: event, error: eErr } = await supabaseAdmin
      .from('events')
      .select('id, status, min_attendees, rsvp_deadline_at')
      .eq('id', eventId)
      .single();
    if (eErr) throw eErr;
    if (event.status === 'cancelled') {
      res.status(409).json({ error: 'event is cancelled' });
      return;
    }
    if (new Date(event.rsvp_deadline_at).getTime() < Date.now()) {
      res.status(409).json({ error: 'RSVP deadline has passed' });
      return;
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

    let eventStatus = event.status;
    if (action === 'accept' && event.status === 'pending' && confirmedCount >= event.min_attendees) {
      // guarded on status so it flips exactly once
      const { error: evErr } = await supabaseAdmin
        .from('events')
        .update({ status: 'confirmed' })
        .eq('id', eventId)
        .eq('status', 'pending');
      if (evErr) throw evErr;
      eventStatus = 'confirmed';
    }

    res.json({ ok: true, myStatus: newStatus, confirmedCount, eventStatus, minAttendees: event.min_attendees });
  } catch (err) {
    console.error('[rsvp] failed', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
