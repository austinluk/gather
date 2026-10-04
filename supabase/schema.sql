-- USERS
-- Filled during onboarding survey
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  area text,                -- "east_van", "downtown", "north_van"
  interests text[],         -- ["hiking", "coffee", "board_games"]
  availability jsonb,       -- { "saturday": ["10:00", "18:00"] }
  group_size text,          -- preferred group size: "small" (3-4) | "large" (5-6)
  created_at timestamptz default now()
);


-- EVENTS
-- Filled after Gemini matches users and picks a venue
create table events (
  id uuid primary key default gen_random_uuid(),
  title text,               -- "Morning Hike at Jericho Beach"
  description text,         -- "A casual walk along the water..."
  interest text,            -- "hiking"
  area text,                -- "kitsilano"
  venue_name text,          -- "Jericho Beach Park"
  venue_address text,       -- "3941 Point Grey Rd, Vancouver"
  venue_lat numeric,
  venue_lng numeric,
  date date,                -- 2026-10-10
  start_time text,          -- "11:00"
  min_attendees int,        -- 3
  max_attendees int,        -- 6
  status text default 'pending', -- "pending", "confirmed", "cancelled"
  created_at timestamptz default now()
);


-- EVENT ATTENDEES
-- Links users to events and tracks their RSVP status
create table event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id),
  user_id uuid references users(id),
  status text default 'invited', -- "invited", "confirmed", "declined"
  created_at timestamptz default now()
);
