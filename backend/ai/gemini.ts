import { GoogleGenAI } from '@google/genai';
import { env } from '../lib/env';
import { ACTIVITIES, getActivity } from '../data/activities';
import type { Pool, PoolUser } from '../matching/pool';

export interface RawGroup {
  memberIds: string[];
  activityId: string;
  areaId: string;
  title: string;
  description: string;
  matchReason: string;
}

export interface GroupingResult {
  groups: RawGroup[];
  unmatchedUserIds: string[];
}

// ─── Prompt ──────────────────────────────────────────────────────────────────
// Only opaque ids + interests/areas/size go to the model — never names or phones.
function buildPrompt(pool: Pool, correction?: string[]): string {
  const activities = ACTIVITIES.map((a) => ({
    id: a.id,
    interest: a.interest,
    min: a.minSize,
    max: a.maxSize,
  }));
  const payload = {
    slotId: pool.slotId,
    candidateAreas: pool.candidateAreas,
    activities,
    users: pool.users.map((u) => ({
      id: u.id,
      interests: u.interests,
      acceptableAreas: u.acceptable_areas,
      groupSize: u.group_size,
    })),
  };
  return [
    'You are a social event matchmaker for Vancouver. You group strangers into real events.',
    'Group the users below into events. Rules:',
    '- Each group shares at least one interest.',
    '- Choose one activityId from activities and one areaId from candidateAreas.',
    '- EVERY member must have the chosen areaId in their acceptableAreas.',
    '- Group size preference: "small" -> 3 to 4 people; "large" -> 8 to 12 people. Do NOT mix small and large preference users in one group.',
    '- A user appears in at most ONE group. Users who do not fit go in unmatchedUserIds.',
    '- Use only ids present in the input. Account for every input user exactly once (grouped or unmatched).',
    correction?.length
      ? `Your previous answer was INVALID: ${correction.join('; ')}. Fix exactly these problems.`
      : '',
    'Return ONLY JSON of this shape, no prose:',
    '{"groups":[{"memberIds":["id"],"activityId":"","areaId":"","title":"","description":"","matchReason":""}],"unmatchedUserIds":["id"]}',
    'Input:',
    JSON.stringify(payload),
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Real Gemini call ─────────────────────────────────────────────────────────
export async function groupUsersWithGemini(
  pool: Pool,
  correction?: string[],
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: buildPrompt(pool, correction),
    config: { responseMimeType: 'application/json' },
  });
  return res.text ?? '';
}

// ─── Deterministic mock (offline / no-key fallback) ────────────────────────────
function pickActivity(members: PoolUser[]): string {
  const count = new Map<string, number>();
  for (const m of members) for (const it of m.interests) count.set(it, (count.get(it) ?? 0) + 1);
  let best = ACTIVITIES[0];
  let bestScore = -1;
  for (const a of ACTIVITIES) {
    const s = count.get(a.interest) ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = a;
    }
  }
  return best.id;
}

export function mockGroupUsers(pool: Pool): GroupingResult {
  // pick the most widely-accepted area so all chosen members can attend
  const areaCount = new Map<string, number>();
  for (const u of pool.users)
    for (const a of u.acceptable_areas) areaCount.set(a, (areaCount.get(a) ?? 0) + 1);
  const area = [...areaCount.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]?.[0];

  const eligible = pool.users
    .filter((u) => area && u.acceptable_areas.includes(area))
    .sort((a, b) => a.id.localeCompare(b.id));

  if (!area || eligible.length < 3) {
    return { groups: [], unmatchedUserIds: pool.users.map((u) => u.id) };
  }

  // round-robin into balanced buckets of ~4
  const numGroups = Math.max(1, Math.round(eligible.length / 4));
  const buckets: PoolUser[][] = Array.from({ length: numGroups }, () => []);
  eligible.forEach((u, i) => buckets[i % numGroups].push(u));

  const groups: RawGroup[] = [];
  const grouped = new Set<string>();
  for (const members of buckets) {
    if (members.length < 3) continue;
    members.forEach((m) => grouped.add(m.id));
    const activityId = pickActivity(members);
    groups.push({
      memberIds: members.map((m) => m.id),
      activityId,
      areaId: area,
      title: `${getActivity(activityId)?.title ?? 'Hangout'} in ${area}`,
      description: 'A casual meetup for people with shared interests nearby.',
      matchReason: 'Shared interests and overlapping availability.',
    });
  }

  const unmatchedUserIds = pool.users.filter((u) => !grouped.has(u.id)).map((u) => u.id);
  return { groups, unmatchedUserIds };
}
