import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export const eventsRouter = Router();

// GET /events/:id/attendees → [{ name, status }]
// Service-role read so the app can show who's in the group (RLS blocks reading
// other users' names from the client directly).
eventsRouter.get('/:id/attendees', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('event_attendees')
      .select('status, users(name)')
      .eq('event_id', req.params.id);
    if (error) throw error;
    const rows = (data ?? []) as unknown as { status: string; users: { name: string | null } | null }[];
    res.json({
      attendees: rows.map((r) => ({ name: r.users?.name ?? 'Someone', status: r.status })),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
