-- Gather seed data — run AFTER schema.sql, in the Supabase SQL editor.
-- Safe to re-run: clears the seeded rows first (by fixed UUID range).
--
-- Pool design (so the demo produces a meaningful result when matching runs):
--   • slot "sat_morning": users 1-8 (hiking + coffee crowd) -> ~2 groups of 4
--   • slot "sun_afternoon": users 9-11 (board games)        -> 1 group of 3
--   • slot "fri_evening": only user 12                       -> under 3, skipped
--   • user 12 (niche: art in Richmond)                       -> left unmatched
-- Slot ids come from backend/data/slots.ts.

delete from users where id >= 'c0000000-0000-4000-8000-000000000001'
                    and id <= 'c0000000-0000-4000-8000-0000000000ff';

insert into users (id, name, phone, interests, acceptable_areas, selected_slots, budget_cad, group_size, preferences) values
  ('c0000000-0000-4000-8000-000000000001', 'Austin', '+1604000001', '{hiking,coffee}',      '{kitsilano,downtown}',      '{sat_morning}',               20, 'small', 'prefers mornings'),
  ('c0000000-0000-4000-8000-000000000002', 'Priya',  '+1604000002', '{hiking,photography}', '{kitsilano,west_van}',      '{sat_morning}',               0,  'small', null),
  ('c0000000-0000-4000-8000-000000000003', 'Marcus', '+1604000003', '{hiking,coffee}',      '{downtown,gastown}',        '{sat_morning}',               30, 'small', null),
  ('c0000000-0000-4000-8000-000000000004', 'Lena',   '+1604000004', '{hiking,running}',     '{kitsilano,downtown}',      '{sat_morning,sat_afternoon}', 15, 'large', null),
  ('c0000000-0000-4000-8000-000000000005', 'Devon',  '+1604000005', '{coffee,art}',         '{downtown,gastown}',        '{sat_morning}',               25, 'small', null),
  ('c0000000-0000-4000-8000-000000000006', 'Sofia',  '+1604000006', '{coffee,music}',       '{gastown,downtown}',        '{sat_morning}',               20, 'small', 'low key spots'),
  ('c0000000-0000-4000-8000-000000000007', 'Ravi',   '+1604000007', '{coffee,board_games}', '{downtown,mount_pleasant}', '{sat_morning}',               10, 'large', null),
  ('c0000000-0000-4000-8000-000000000008', 'Mei',    '+1604000008', '{coffee,hiking}',      '{kitsilano,downtown}',      '{sat_morning}',               20, 'small', null),
  ('c0000000-0000-4000-8000-000000000009', 'Tom',    '+1604000009', '{board_games,music}',  '{mount_pleasant,east_van}', '{sun_afternoon}',             15, 'small', null),
  ('c0000000-0000-4000-8000-00000000000a', 'Hana',   '+1604000010', '{board_games,art}',    '{mount_pleasant,downtown}', '{sun_afternoon}',             20, 'small', null),
  ('c0000000-0000-4000-8000-00000000000b', 'Jamal',  '+1604000011', '{board_games,coffee}', '{mount_pleasant,east_van}', '{sun_afternoon}',             10, 'large', null),
  ('c0000000-0000-4000-8000-00000000000c', 'Elise',  '+1604000012', '{art}',                '{richmond}',                '{fri_evening}',               0,  'small', 'quiet galleries');
