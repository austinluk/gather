// Offline validation tests — no network, no DB. Run: npm run match
import { mockGroupUsers } from '../ai/gemini';
import { validateGrouping } from '../matching/validate';
import type { Pool } from '../matching/pool';

const pool: Pool = {
  slotId: 'sat_morning',
  candidateAreas: ['downtown', 'kitsilano'],
  users: [
    { id: 'u1', interests: ['hiking'], acceptable_areas: ['downtown', 'kitsilano'], group_size: 'small' },
    { id: 'u2', interests: ['hiking', 'coffee'], acceptable_areas: ['downtown'], group_size: 'small' },
    { id: 'u3', interests: ['coffee'], acceptable_areas: ['downtown'], group_size: 'small' },
    { id: 'u4', interests: ['hiking'], acceptable_areas: ['downtown'], group_size: 'small' },
  ],
};

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// 1. the mock grouping must itself be valid
const mock = mockGroupUsers(pool);
check('mock grouping passes validation', validateGrouping(mock, pool).ok);
check('mock formed at least one group', mock.groups.length >= 1);

// 2. rejects a member id not in the pool
check(
  'rejects unknown member',
  !validateGrouping(
    { groups: [{ memberIds: ['ghost', 'u1', 'u2'], activityId: 'coffee_hangout', areaId: 'downtown', title: 't', description: 'd', matchReason: 'r' }], unmatchedUserIds: ['u3', 'u4'] },
    pool,
  ).ok,
);

// 3. rejects an area a member does not accept (u2/u3 only accept downtown)
check(
  'rejects unaccepted area',
  !validateGrouping(
    { groups: [{ memberIds: ['u1', 'u2', 'u3'], activityId: 'coffee_hangout', areaId: 'kitsilano', title: 't', description: 'd', matchReason: 'r' }], unmatchedUserIds: ['u4'] },
    pool,
  ).ok,
);

// 4. rejects when a pool user is neither grouped nor unmatched (u4 missing)
check(
  'rejects unaccounted user',
  !validateGrouping(
    { groups: [{ memberIds: ['u1', 'u2', 'u3'], activityId: 'coffee_hangout', areaId: 'downtown', title: 't', description: 'd', matchReason: 'r' }], unmatchedUserIds: [] },
    pool,
  ).ok,
);

// 5. rejects malformed shape
check('rejects malformed JSON', !validateGrouping({ nope: true }, pool).ok);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
