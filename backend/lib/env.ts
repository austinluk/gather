import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name} (check backend/.env)`);
  return v;
}

export const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY ?? '',
  USE_MOCK_VENUES: (process.env.USE_MOCK_VENUES ?? 'true') === 'true',
  // Falls back to the deterministic mock grouping if forced on, or if no key is set.
  USE_MOCK_AI: (process.env.USE_MOCK_AI ?? 'false') === 'true',
  PORT: Number(process.env.PORT ?? 3001),
};

export const useMockAi = env.USE_MOCK_AI || !env.GEMINI_API_KEY;
