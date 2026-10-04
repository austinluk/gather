-- Gather schema — run the whole file in the Supabase SQL editor.
--
-- Trust boundary:
--   • Backend uses the service-role key and BYPASSES RLS (does the matching,
--     creates events, handles RSVP).
--   • The Expo app uses the publishable/anon key and is constrained by the RLS
--     policies at the bottom — it can read its own data and its events, but it
--     CANNOT create events or modify RSVPs (those go through the backend).

-- ─── USERS ──────────────────────────────────────────────────────────────────
-- One row per person. For users who sign in with Supabase Auth, id == auth.uid()
-- (the app inserts its own row at signup). Seeded demo users are backend-only.
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  interests text[] not null default '{}',        -- ["hiking", "coffee"]
  acceptable_areas text[] not null default '{}',  -- ["kitsilano", "downtown"]
  budget_cad int not null default 0,              -- max per event in CAD; 0 = free only
  group_size text not null default 'small'
    check (group_size in ('small', 'large')),     -- "small" (3-4) | "large" (5-6)
  preferences text,                               -- optional free text
  created_at timestamptz default now()
);

-- ─── ROUNDS ─────────────────────────────────────────────────────────────────
-- A weekly matching round. Matching runs at cutoff_at (Sunday 9am Vancouver).
create table rounds (
  id uuid primary key default gen_random_uuid(),
  cutoff_at timestamptz not null,          -- join before this to be included
  rsvp_deadline_at timestamptz not null,   -- pending events confirm-or-cancel here
  status text not null default 'open'
    check (status in ('open', 'matching', 'completed', 'failed')),
  created_at timestamptz default now()
);

-- ─── SLOTS ──────────────────────────────────────────────────────────────────
-- Concrete dated availability windows offered within a round (e.g. Sat 10am-noon).
create table slots (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text,                              -- e.g. "Saturday morning"
  created_at timestamptz default now(),
  check (ends_at > starts_at)
);

-- ─── USER SLOT SELECTIONS ───────────────────────────────────────────────────
-- Which slots each user marked themselves free for.
create table user_slot_selections (
  user_id uuid not null references users(id) on delete cascade,
  slot_id uuid not null references slots(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, slot_id)
);

-- ─── EVENTS ─────────────────────────────────────────────────────────────────
-- Created by the backend after Gemini matches a group and a venue is chosen.
create table events (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete set null,
  title text not null,
  description text,
  activity_id text not null,               -- id from the backend activity catalog
  area text not null,                      -- chosen meeting neighborhood
  starts_at timestamptz not null,          -- = slot start
  ends_at timestamptz not null,            -- = start + activity duration
  rsvp_deadline_at timestamptz not null,
  venue_provider text,                     -- "mock" | "google_places"
  venue_provider_id text,                  -- stable id from the provider
  venue_name text,
  venue_address text,
  venue_lat numeric,
  venue_lng numeric,
  min_attendees int not null default 3,
  max_attendees int not null default 5,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz default now(),
  check (ends_at > starts_at),
  check (max_attendees >= min_attendees)
);

-- ─── EVENT ATTENDEES ────────────────────────────────────────────────────────
-- Links users to events and tracks RSVP status. One row per (event, user).
create table event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'confirmed', 'declined')),
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
create index on slots (round_id);
create index on user_slot_selections (slot_id);
create index on events (round_id);
create index on events (status);
create index on event_attendees (event_id);
create index on event_attendees (user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Security-definer helper: a policy on event_attendees that itself SELECTs from
-- event_attendees would recurse infinitely under RLS. This function runs with
-- definer rights (bypasses RLS) so membership checks are safe to use in policies.
create or replace function is_event_member(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from event_attendees
    where event_id = p_event_id and user_id = auth.uid()
  );
$$;

alter table users enable row level security;
alter table rounds enable row level security;
alter table slots enable row level security;
alter table user_slot_selections enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;

-- users: each person reads/writes only their own row
create policy users_select_own on users for select using (auth.uid() = id);
create policy users_insert_own on users for insert with check (auth.uid() = id);
create policy users_update_own on users for update using (auth.uid() = id);

-- rounds + slots: any signed-in user may read (to show the schedule and slots)
create policy rounds_select on rounds for select using (auth.uid() is not null);
create policy slots_select on slots for select using (auth.uid() is not null);

-- slot selections: each person manages only their own
create policy uss_select_own on user_slot_selections for select using (auth.uid() = user_id);
create policy uss_insert_own on user_slot_selections for insert with check (auth.uid() = user_id);
create policy uss_delete_own on user_slot_selections for delete using (auth.uid() = user_id);

-- events: visible only to their invited members. No app INSERT/UPDATE/DELETE
-- policy exists, so those are denied for the app (backend service role bypasses RLS).
create policy events_select_members on events for select using (is_event_member(id));

-- attendees: members can read all attendee rows for their events (powers the live
-- spot counter). No app write policy -> RSVP must go through the backend.
create policy ea_select_members on event_attendees for select using (is_event_member(event_id));
