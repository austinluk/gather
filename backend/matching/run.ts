import { useMockAi } from '../lib/env';
import { buildPools, getWaitingUsers, type Pool } from './pool';
import {
  groupUsersWithGemini,
  mockGroupUsers,
  type GroupingResult,
  type RawGroup,
} from '../ai/gemini';
import { validateGrouping } from './validate';

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return start >= 0 && end > start ? text.slice(start, end + 1) : text;
}

async function getGrouping(pool: Pool, correction?: string[]): Promise<unknown> {
  if (useMockAi) return mockGroupUsers(pool);
  const text = await groupUsersWithGemini(pool, correction);
  try {
    return JSON.parse(extractJson(text));
  } catch {
    // Unparseable model output -> treat as "everyone unmatched"; validation then
    // fails and the correction pass runs.
    return { groups: [], unmatchedUserIds: pool.users.map((u) => u.id) };
  }
}

// Call the model, validate, and allow ONE correction attempt. No fabricated
// fallback event — an unfixable pool yields null and is skipped.
async function groupPoolWithRetry(pool: Pool): Promise<GroupingResult | null> {
  const first = await getGrouping(pool);
  const v1 = validateGrouping(first, pool);
  if (v1.ok) return v1.result;

  const second = await getGrouping(pool, v1.errors);
  const v2 = validateGrouping(second, pool);
  if (v2.ok) return v2.result;

  console.warn(`[match] pool slot=${pool.slotId} failed validation twice:`, v2.errors);
  return null;
}

export interface MatchRunResult {
  mode: 'mock' | 'gemini';
  groups: RawGroup[];
  unmatchedUserIds: string[];
  poolCount: number;
}

export async function runMatch(): Promise<MatchRunResult> {
  const users = await getWaitingUsers();
  const pools = buildPools(users);
  const assigned = new Set<string>();
  const groups: RawGroup[] = [];

  // Sequential so we can dedupe: once a user is placed, drop them from later pools.
  for (const pool of pools) {
    const fresh: Pool = {
      ...pool,
      users: pool.users.filter((u) => !assigned.has(u.id)),
    };
    if (fresh.users.length < 3) continue;

    const result = await groupPoolWithRetry(fresh);
    if (!result) continue;

    for (const g of result.groups) {
      groups.push(g);
      g.memberIds.forEach((id) => assigned.add(id));
    }
  }

  const unmatchedUserIds = users.map((u) => u.id).filter((id) => !assigned.has(id));
  return {
    mode: useMockAi ? 'mock' : 'gemini',
    groups,
    unmatchedUserIds,
    poolCount: pools.length,
  };
}
