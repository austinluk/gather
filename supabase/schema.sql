-- Gather schema — run the WHOLE file in the Supabase SQL editor FIRST, then seed.sql.
--
-- Trust boundary:
--   • Backend uses the service-role key and BYPASSES RLS (matching, event
--     creation, RSVP handling).
--   • The Expo app uses the publishable/anon key and is constrained by the RLS
--     policies below — it reads its own data and its events, but CANNOT create
--     events or modify RSVPs (those go through the backend).
--
-- Scheduling model: a backend cron runs every Sunday 9am (America/Vancouver) and
-- matches everyone currently waiting. There is NO rounds table — the weekly
-- cutoff is computed in code, and each event carries its own RSVP deadline.
-- Availability is a fixed weekly slot menu (see backend/data/slots.ts); each user
-- stores the slot ids they picked in users.selected_slots.

-- ─── USERS ──────────────────────────────────────────────────────────────────
-- One row per person. For users who sign in with Supabase Auth, id == auth.uid()
-- (the app inserts its own row at signup). Seeded demo users are backend-only.
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  gender text,                                     -- "Woman" | "Man" | "Prefer not to say" | "Other"
  interests text[] not null default '{}',         -- ["hiking", "coffee"]
  acceptable_areas text[] not null default '{}',   -- ["kitsilano", "downtown"]
  selected_slots text[] not null default '{}',     -- slot ids from backend/data/slots.ts
  budget_cad int not null default 0,               -- max per event in CAD; 0 = free only
  group_size text not null default 'small'
    check (group_size in ('small', 'large')),      -- "small" (3-4) | "large" (8-12)
  preferences text,                                -- optional free text
  created_at timestamptz default now()
);

-- ─── EVENTS ─────────────────────────────────────────────────────────────────
-- Created by the backend after Gemini matches a group and a venue is chosen.
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  activity_id text not null,               -- id from backend/data/activities.ts
  slot_id text not null,                   -- weekly slot id this event fills
  area text not null,                      -- chosen meeting neighborhood
  starts_at timestamptz not null,          -- = slot start for the upcoming week
  ends_at timestamptz not null,            -- = start + activity duration
  rsvp_deadline_at timestamptz not null,   -- pending event confirms-or-cancels here
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
create index on events (status);
create index on event_attendees (event_id);
create index on event_attendees (user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Security-definer helper: a policy on event_attendees that itself SELECTs from
-- event_attendees would recurse infinitely under RLS. This runs with definer
-- rights (bypasses RLS) so membership checks are safe to use inside policies.
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
alter table events enable row level security;
alter table event_attendees enable row level security;

-- users: each person reads/writes only their own row (incl. their selected_slots)
create policy users_select_own on users for select using (auth.uid() = id);
create policy users_insert_own on users for insert with check (auth.uid() = id);
create policy users_update_own on users for update using (auth.uid() = id);

-- events: visible only to their invited members. No app write policy exists, so
-- INSERT/UPDATE/DELETE are denied for the app (backend service role bypasses RLS).
create policy events_select_members on events for select using (is_event_member(id));

-- attendees: members can read all attendee rows for their events (powers the live
-- spot counter). No app write policy -> RSVP must go through the backend.
create policy ea_select_members on event_attendees for select using (is_event_member(event_id));
