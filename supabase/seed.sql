-- Gather seed data — run AFTER schema.sql, in the Supabase SQL editor.
-- Safe to re-run: it clears the seeded rows first (by fixed UUID ranges).
--
-- Pool design (so the demo produces a meaningful result):
--   • Slot A "Saturday morning": users 1-8 (hiking + coffee crowd) -> ~2 groups of 4
--   • Slot B "Sunday afternoon": users 9-11 (board games) -> 1 group of 3
--   • Slot C "Friday evening":   only user 12 -> under 3, correctly skipped
--   • User 12 (niche: art in Richmond) -> left unmatched
-- All times are relative to now() so the round is always in the near future.

-- ── clean previous seed ───────────────────────────────────────────────────
delete from user_slot_selections where slot_id in (
  select id from slots where round_id = 'a0000000-0000-4000-8000-000000000001');
delete from slots where round_id = 'a0000000-0000-4000-8000-000000000001';
delete from rounds where id = 'a0000000-0000-4000-8000-000000000001';
delete from users where id >= 'c0000000-0000-4000-8000-000000000001'
                    and id <= 'c0000000-0000-4000-8000-0000000000ff';

-- ── round (cutoff 5 min out so the demo can trigger it live) ───────────────
insert into rounds (id, cutoff_at, rsvp_deadline_at, status) values
  ('a0000000-0000-4000-8000-000000000001',
   now() + interval '5 minutes',
   now() + interval '1 day',
   'open');

-- ── slots ──────────────────────────────────────────────────────────────────
insert into slots (id, round_id, starts_at, ends_at, label) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
     now() + interval '2 days',  now() + interval '2 days 2 hours',  'Saturday morning'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
     now() + interval '3 days',  now() + interval '3 days 2 hours',  'Sunday afternoon'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
     now() + interval '1 day',   now() + interval '1 day 2 hours',   'Friday evening');

-- ── users ──────────────────────────────────────────────────────────────────
insert into users (id, name, phone, interests, acceptable_areas, budget_cad, group_size, preferences) values
  ('c0000000-0000-4000-8000-000000000001', 'Austin',  '+1604000001', '{hiking,coffee}',      '{kitsilano,downtown}', 20, 'small', 'prefers mornings'),
  ('c0000000-0000-4000-8000-000000000002', 'Priya',   '+1604000002', '{hiking,photography}', '{kitsilano,west_van}', 0,  'small', null),
  ('c0000000-0000-4000-8000-000000000003', 'Marcus',  '+1604000003', '{hiking,coffee}',      '{downtown,gastown}',   30, 'small', null),
  ('c0000000-0000-4000-8000-000000000004', 'Lena',    '+1604000004', '{hiking,running}',     '{kitsilano,downtown}', 15, 'large', null),
  ('c0000000-0000-4000-8000-000000000005', 'Devon',   '+1604000005', '{coffee,art}',         '{downtown,gastown}',   25, 'small', null),
  ('c0000000-0000-4000-8000-000000000006', 'Sofia',   '+1604000006', '{coffee,music}',       '{gastown,downtown}',   20, 'small', 'low key spots'),
  ('c0000000-0000-4000-8000-000000000007', 'Ravi',    '+1604000007', '{coffee,board_games}', '{downtown,mount_pleasant}', 10, 'large', null),
  ('c0000000-0000-4000-8000-000000000008', 'Mei',     '+1604000008', '{coffee,hiking}',      '{kitsilano,downtown}', 20, 'small', null),
  ('c0000000-0000-4000-8000-000000000009', 'Tom',     '+1604000009', '{board_games,music}',  '{mount_pleasant,east_van}', 15, 'small', null),
  ('c0000000-0000-4000-8000-00000000000a', 'Hana',    '+1604000010', '{board_games,art}',    '{mount_pleasant,downtown}', 20, 'small', null),
  ('c0000000-0000-4000-8000-00000000000b', 'Jamal',   '+1604000011', '{board_games,coffee}', '{mount_pleasant,east_van}', 10, 'large', null),
  ('c0000000-0000-4000-8000-00000000000c', 'Elise',   '+1604000012', '{art}',                '{richmond}',           0,  'small', 'quiet galleries');

-- ── slot selections ────────────────────────────────────────────────────────
-- Slot A (Saturday morning): users 1-8
insert into user_slot_selections (user_id, slot_id)
select id, 'b0000000-0000-4000-8000-000000000001'
from users
where id between 'c0000000-0000-4000-8000-000000000001' and 'c0000000-0000-4000-8000-000000000008';

-- Slot B (Sunday afternoon): users 9-11
insert into user_slot_selections (user_id, slot_id)
select id, 'b0000000-0000-4000-8000-000000000002'
from users
where id between 'c0000000-0000-4000-8000-000000000009' and 'c0000000-0000-4000-8000-00000000000b';

-- Slot C (Friday evening): only user 12 -> under threshold, skipped by the pool builder
insert into user_slot_selections (user_id, slot_id) values
  ('c0000000-0000-4000-8000-00000000000c', 'b0000000-0000-4000-8000-000000000003');
