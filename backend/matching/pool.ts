import { supabaseAdmin } from '../lib/supabaseAdmin';

// A user as seen by the matcher. NO PII (no name/phone) — only what grouping needs.
export interface PoolUser {
  id: string;
  interests: string[];
  acceptable_areas: string[];
  group_size: string;
}

export interface Pool {
  slotId: string;
  users: PoolUser[];
  candidateAreas: string[];
}

interface WaitingUser extends PoolUser {
  selected_slots: string[];
}

// Users eligible to be matched: have at least one selected slot and no active
// pending/confirmed invitation.
export async function getWaitingUsers(): Promise<WaitingUser[]> {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, interests, acceptable_areas, selected_slots, group_size');
  if (error) throw error;

  const { data: busy, error: busyErr } = await supabaseAdmin
    .from('event_attendees')
    .select('user_id, events!inner(status)')
    .in('status', ['invited', 'confirmed'])
    .eq('events.status', 'pending');
  if (busyErr) throw busyErr;

  const busyIds = new Set((busy ?? []).map((b: { user_id: string }) => b.user_id));

  return (users ?? [])
    .filter((u) => (u.selected_slots?.length ?? 0) > 0 && !busyIds.has(u.id))
    .map((u) => ({
      id: u.id,
      interests: u.interests ?? [],
      acceptable_areas: u.acceptable_areas ?? [],
      group_size: u.group_size ?? 'small',
      selected_slots: u.selected_slots ?? [],
    }));
}

// Group users into candidate pools by shared slot. Pools under 3 are skipped
// (can't form a group). A user in multiple slots appears in multiple pools; the
// orchestrator dedupes once someone is placed in a group.
export function buildPools(users: WaitingUser[]): Pool[] {
  const bySlot = new Map<string, PoolUser[]>();
  for (const u of users) {
    const pu: PoolUser = {
      id: u.id,
      interests: u.interests,
      acceptable_areas: u.acceptable_areas,
      group_size: u.group_size,
    };
    for (const slotId of u.selected_slots) {
      const list = bySlot.get(slotId) ?? [];
      list.push(pu);
      bySlot.set(slotId, list);
    }
  }

  const pools: Pool[] = [];
  for (const [slotId, poolUsers] of bySlot) {
    if (poolUsers.length < 3) continue;
    const candidateAreas = Array.from(
      new Set(poolUsers.flatMap((u) => u.acceptable_areas)),
    );
    pools.push({ slotId, users: poolUsers, candidateAreas });
  }
  return pools;
}
