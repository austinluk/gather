import { Router } from 'express';
import { runMatch } from '../matching/run';

export const matchRouter = Router();

// Manual/demo trigger: builds pools from all waiting users and runs the matcher.
// Sprint 3 returns the validated groups; venue selection + persistence land in Sprint 4.
matchRouter.post('/run', async (_req, res) => {
  try {
    const result = await runMatch();
    res.json(result);
  } catch (err) {
    console.error('[match] run failed', err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});
