import { Router } from 'express';
import { applyRsvp, RsvpError } from '../matching/rsvpService';

export const rsvpRouter = Router();

// POST /rsvp  { eventId, userId, action: 'accept' | 'decline' }
// NOTE (happy-path auth): trusts the userId in the body so the demo can RSVP on
// behalf of seeded users. Production would verify the caller's Supabase JWT.
rsvpRouter.post('/', async (req, res) => {
  const { eventId, userId, action } = req.body ?? {};
  if (!eventId || !userId || (action !== 'accept' && action !== 'decline')) {
    res.status(400).json({ error: 'eventId, userId, and action (accept|decline) are required' });
    return;
  }
  try {
    const result = await applyRsvp(eventId, userId, action);
    res.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof RsvpError) {
      res.status(err.code).json({ error: err.message });
      return;
    }
    console.error('[rsvp] failed', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
