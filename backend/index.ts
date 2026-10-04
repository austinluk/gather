import cors from 'cors';
import express from 'express';
import { env, useMockAi } from './lib/env';
import { matchRouter } from './routes/match';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, aiMode: useMockAi ? 'mock' : 'gemini', model: env.GEMINI_MODEL });
});

app.use('/match', matchRouter);

app.listen(env.PORT, () => {
  console.log(`Gather backend on http://localhost:${env.PORT} (AI: ${useMockAi ? 'mock' : 'gemini/' + env.GEMINI_MODEL})`);
});
