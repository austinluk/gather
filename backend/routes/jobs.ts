import { Router } from 'express';
import { closeExpiredEvents } from '../jobs/closeExpired';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { applyRsvp } from '../matching/rsvpService';
import { findVenue } from '../venues';
import { resolveSlotTime } from '../matching/slotTime';

// 7 seeded users → + the signed-in user = a group of 8 for the demo.
const DEMO_GROUP = [
  'c0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000004',
  'c0000000-0000-4000-8000-000000000005',
  'c0000000-0000-4000-8000-000000000006',
  'c0000000-0000-4000-8000-000000000008',
  'c0000000-0000-4000-8000-000000000009',
];

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

// POST /jobs/demo-invite { userId } → deterministic demo: wipe events, then
// create one real "Morning Hike" and invite the signed-in user + 7 seeded users
// (a group of 8). Guarantees the demo outcome regardless of Gemini.
jobsRouter.post('/demo-invite', async (req, res) => {
  const { userId } = req.body ?? {};
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }
  try {
    await supabaseAdmin.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // make sure the signed-in user has a row (don't overwrite their profile)
    await supabaseAdmin.from('users').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true });

    const venue = await findVenue('morning_hike', 'kitsilano');
    const t = resolveSlotTime('sat_morning', 120);
    const startsAt = (t?.startsAt ?? new Date()).toISOString();
    const endsAt = (t?.endsAt ?? new Date()).toISOString();

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        title: `Morning Hike at ${venue?.name ?? 'Jericho Beach'}`,
        description:
          'A relaxed Saturday-morning hike with a friendly group who all love the outdoors. Easy pace, great views over the water, and good company. Nobody organized this — Gather matched you from people nearby who share your interests. Just show up.',
        activity_id: 'morning_hike',
        slot_id: 'sat_morning',
        area: 'kitsilano',
        starts_at: startsAt,
        ends_at: endsAt,
        rsvp_deadline_at: startsAt,
        venue_provider: venue?.provider ?? 'mock',
        venue_provider_id: venue?.providerId ?? 'demo',
        venue_name: venue?.name ?? 'Jericho Beach Park',
        venue_address: venue?.address ?? 'Vancouver, BC',
        venue_lat: venue?.lat ?? 49.2726,
        venue_lng: venue?.lng ?? -123.1927,
        min_attendees: 3,
        max_attendees: 8,
        status: 'pending',
      })
      .select('id')
      .single();
    if (error || !event) throw error ?? new Error('event insert failed');

    const rows = [
      { event_id: event.id, user_id: userId, status: 'invited' },
      ...DEMO_GROUP.map((id) => ({ event_id: event.id, user_id: id, status: 'invited' })),
    ];
    const { error: attErr } = await supabaseAdmin.from('event_attendees').insert(rows);
    if (attErr) throw attErr;

    res.json({ eventId: event.id, invited: rows.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
