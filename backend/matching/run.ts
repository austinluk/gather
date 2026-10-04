import { useMockAi } from '../lib/env';
import { getGroupSizeRange } from '../data/groupSizes';
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
  try {
    const text = await groupUsersWithGemini(pool, correction);
    return JSON.parse(extractJson(text));
  } catch (err) {
    // Gemini unavailable (e.g. 503 overload) or unparseable output -> fall back
    // to the deterministic mock for this pool so a run never crashes mid-way.
    console.warn(
      '[match] gemini failed, using mock for this pool:',
      err instanceof Error ? err.message : err,
    );
    return mockGroupUsers(pool);
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

    const prefById = new Map(pool.users.map((u) => [u.id, u.group_size]));

    for (const g of result.groups) {
      // Confirm threshold comes from the group's size preference (small -> 3,
      // large -> 8), capped at the actual group size so it stays reachable.
      const prefs = g.memberIds.map((id) => prefById.get(id) ?? 'small');
      const largeCount = prefs.filter((p) => p === 'large').length;
      const pref = largeCount > prefs.length / 2 ? 'large' : 'small';
      const minAttendees = Math.min(getGroupSizeRange(pref).min, g.memberIds.length);

      const outcome = await persistGroup(g, pool.slotId, minAttendees);
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
