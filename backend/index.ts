import cors from 'cors';
import express from 'express';
import { env, useMockAi } from './lib/env';
import { startScheduler } from './jobs/scheduler';
import { matchRouter } from './routes/match';
import { rsvpRouter } from './routes/rsvp';
import { jobsRouter } from './routes/jobs';
import { eventsRouter } from './routes/events';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, aiMode: useMockAi ? 'mock' : 'gemini', model: env.GEMINI_MODEL });
});

app.use('/match', matchRouter);
app.use('/rsvp', rsvpRouter);
app.use('/jobs', jobsRouter);
app.use('/events', eventsRouter);

app.listen(env.PORT, () => {
  console.log(`Gather backend on http://localhost:${env.PORT} (AI: ${useMockAi ? 'mock' : 'gemini/' + env.GEMINI_MODEL})`);
  startScheduler();
});
