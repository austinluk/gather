import cron from 'node-cron';
import { runMatch } from '../matching/run';
import { closeExpiredEvents } from './closeExpired';

// All scheduling lives server-side (an Expo app has no reliable always-on
// scheduler). Times are America/Vancouver.
export function startScheduler() {
  // Weekly matching round: Sunday 09:00 — groups everyone currently waiting.
  cron.schedule(
    '0 9 * * 0',
    async () => {
      console.log('[cron] weekly match run starting');
      try {
        const r = await runMatch();
        console.log(`[cron] match done: ${r.events.length} events, ${r.unmatchedUserIds.length} unmatched`);
      } catch (e) {
        console.error('[cron] match run failed', e);
      }
    },
    { timezone: 'America/Vancouver' },
  );

  // Deadline sweep: hourly — cancel pending events that didn't reach the minimum.
  cron.schedule(
    '7 * * * *',
    async () => {
      try {
        const r = await closeExpiredEvents();
        if (r.cancelled) console.log(`[cron] cancelled ${r.cancelled} expired event(s)`);
      } catch (e) {
        console.error('[cron] close-expired failed', e);
      }
    },
    { timezone: 'America/Vancouver' },
  );

  console.log('[cron] scheduler started: Sunday 9am America/Vancouver + hourly deadline sweep');
}
