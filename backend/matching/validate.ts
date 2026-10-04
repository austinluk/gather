import { z } from 'zod';
import { ACTIVITY_IDS, getActivity } from '../data/activities';
import { AREA_IDS } from '../data/areas';
import type { GroupingResult } from '../ai/gemini';
import type { Pool } from './pool';

const groupingSchema = z.object({
  groups: z.array(
    z.object({
      memberIds: z.array(z.string()).min(1),
      activityId: z.string(),
      areaId: z.string(),
      title: z.string(),
      description: z.string(),
      matchReason: z.string(),
    }),
  ),
  unmatchedUserIds: z.array(z.string()),
});

export type ValidationOutcome =
  | { ok: true; result: GroupingResult }
  | { ok: false; errors: string[] };

// Shape + business-rule validation. Mirrors the plan's checklist. On any failure
// returns the specific errors so the caller can give them back to Gemini once.
export function validateGrouping(raw: unknown, pool: Pool): ValidationOutcome {
  const parsed = groupingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, errors: ['malformed JSON: ' + parsed.error.issues.map((i) => i.message).join(', ')] };
  }
  const data = parsed.data;
  const errors: string[] = [];

  const poolIds = new Set(pool.users.map((u) => u.id));
  const areasById = new Map(pool.users.map((u) => [u.id, u.acceptable_areas]));
  const seen = new Set<string>();

  for (const g of data.groups) {
    if (!ACTIVITY_IDS.includes(g.activityId)) errors.push(`unknown activityId "${g.activityId}"`);
    if (!AREA_IDS.includes(g.areaId)) errors.push(`unknown areaId "${g.areaId}"`);

    const size = g.memberIds.length;
    if (size < 3 || size > 12) errors.push(`group size ${size} out of range 3-12`);
    const act = getActivity(g.activityId);
    if (act && (size < act.minSize || size > act.maxSize)) {
      errors.push(`group size ${size} violates activity ${act.id} (${act.minSize}-${act.maxSize})`);
    }

    for (const id of g.memberIds) {
      if (!poolIds.has(id)) errors.push(`member "${id}" not in pool`);
      if (seen.has(id)) errors.push(`member "${id}" appears in multiple groups`);
      seen.add(id);
      const areas = areasById.get(id) ?? [];
      if (!areas.includes(g.areaId)) errors.push(`member "${id}" does not accept area "${g.areaId}"`);
    }
  }

  for (const id of data.unmatchedUserIds) {
    if (!poolIds.has(id)) errors.push(`unmatched "${id}" not in pool`);
    if (seen.has(id)) errors.push(`"${id}" is both grouped and unmatched`);
  }

  const accounted = new Set([...seen, ...data.unmatchedUserIds]);
  for (const id of poolIds) {
    if (!accounted.has(id)) errors.push(`user "${id}" is neither grouped nor unmatched`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, result: data };
}
