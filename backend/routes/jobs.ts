import { Router } from 'express';
import { closeExpiredEvents } from '../jobs/closeExpired';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { applyRsvp } from '../matching/rsvpService';

export const jobsRouter = Router();

// Deadline sweep (also wired to the hourly cron in Sprint 6).
jobsRouter.post('/close-expired', async (_req, res) => {
  try {
    res.json(await closeExpiredEvents());
  } catch (err) {
    console.error('[jobs] close-expired failed', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ─── Demo controls (service-role, bypass RLS — for the live demo panel) ───────

// GET /jobs/demo-state → all events with their attendees + confirmed counts.
jobsRouter.get('/demo-state', async (_req, res) => {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, title, venue_name, area, status, min_attendees, max_attendees, starts_at')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const out = [];
    for (const ev of events ?? []) {
      const { data: attendees } = await supabaseAdmin
        .from('event_attendees')
        .select('status, users(name)')
        .eq('event_id', ev.id);
      const rows = (attendees ?? []) as unknown as { status: string; users: { name: string | null } | null }[];
      out.push({
        ...ev,
        confirmedCount: rows.filter((r) => r.status === 'confirmed').length,
        members: rows.map((r) => ({ name: r.users?.name ?? '?', status: r.status })),
      });
    }
    res.json({ events: out });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /jobs/demo-accept { eventId } → accept the next still-invited member.
jobsRouter.post('/demo-accept', async (req, res) => {
  const { eventId } = req.body ?? {};
  if (!eventId) {
    res.status(400).json({ error: 'eventId required' });
    return;
  }
  try {
    const { data: next } = await supabaseAdmin
      .from('event_attendees')
      .select('user_id, users(name)')
      .eq('event_id', eventId)
      .eq('status', 'invited')
      .limit(1)
      .maybeSingle();
    if (!next) {
      res.json({ ok: true, note: 'no more invited members' });
      return;
    }
    const result = await applyRsvp(eventId, (next as { user_id: string }).user_id, 'accept');
    const who = (next as unknown as { users: { name: string | null } | null }).users?.name ?? 'Someone';
    res.json({ ok: true, who, ...result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// POST /jobs/reset-demo → delete all events (cascades to attendees). Seeded users remain.
jobsRouter.post('/reset-demo', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
