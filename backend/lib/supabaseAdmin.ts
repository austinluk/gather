import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Service-role client. BYPASSES row level security — backend use only.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
