import { supabaseAdmin } from '../lib/supabaseAdmin';

// At/after each event's RSVP deadline: cancel pending events that didn't reach
// min_attendees. Confirmed events are left alone (they locked in at RSVP time).
// Wired to the Sunday cron in Sprint 6; exposed as POST /jobs/close-expired for
// manual/demo use.
export async function closeExpiredEvents(): Promise<{ cancelled: number; checked: number }> {
  const nowIso = new Date().toISOString();

  const { data: expired, error } = await supabaseAdmin
    .from('events')
    .select('id, min_attendees')
    .eq('status', 'pending')
    .lt('rsvp_deadline_at', nowIso);
  if (error) throw error;

  let cancelled = 0;
  for (const ev of expired ?? []) {
    const { count, error: cErr } = await supabaseAdmin
      .from('event_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', ev.id)
      .eq('status', 'confirmed');
    if (cErr) throw cErr;
    if ((count ?? 0) < ev.min_attendees) {
      await supabaseAdmin
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', ev.id)
        .eq('status', 'pending');
      cancelled++;
    }
  }

  return { cancelled, checked: (expired ?? []).length };
}
