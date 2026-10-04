import { useMockAi } from '../lib/env';
import { buildPools, getWaitingUsers, type Pool } from './pool';
import {
  groupUsersWithGemini,
  mockGroupUsers,
  type GroupingResult,
} from '../ai/gemini';
import { persistGroup, type CreatedEvent } from './persist';
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
  events: CreatedEvent[];
  dropped: { reason: string }[];
  unmatchedUserIds: string[];
  poolCount: number;
}

export async function runMatch(): Promise<MatchRunResult> {
  const users = await getWaitingUsers();
  const pools = buildPools(users);
  const assigned = new Set<string>();
  const events: CreatedEvent[] = [];
  const dropped: { reason: string }[] = [];

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
      const outcome = await persistGroup(g, pool.slotId);
      if (outcome.created) {
        events.push(outcome.created);
        g.memberIds.forEach((id) => assigned.add(id)); // only count placed on success
      } else {
        dropped.push({ reason: outcome.droppedReason ?? 'unknown' });
        // members stay unassigned -> reported as unmatched
      }
    }
  }

  const unmatchedUserIds = users.map((u) => u.id).filter((id) => !assigned.has(id));
  return {
    mode: useMockAi ? 'mock' : 'gemini',
    events,
    dropped,
    unmatchedUserIds,
    poolCount: pools.length,
  };
}
