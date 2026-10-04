import { Router } from 'express';
import { closeExpiredEvents } from '../jobs/closeExpired';

export const jobsRouter = Router();

// Manual/demo trigger for the deadline sweep (cron wiring lands in Sprint 6).
jobsRouter.post('/close-expired', async (_req, res) => {
  try {
    const result = await closeExpiredEvents();
    res.json(result);
  } catch (err) {
    console.error('[jobs] close-expired failed', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
