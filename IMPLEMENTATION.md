```md
# Gather: Gemini Event Matching Implementation Plan

## Goal

Build a hackathon MVP that automatically proposes events for strangers in Vancouver based on their interests, availability, preferences, and meeting areas.

Gemini must make meaningful decisions about **who meets and what they do**. The backend handles eligibility, validation, persistence, and event confirmation.

## Repository

- Path: `/Users/alexyang/Code/gather`
- Expo Router / React Native application.
- Last inspected dependencies: Expo `~57.0.26`, React Native `0.86.3`.
- Uses npm and `package-lock.json`.
- Existing schema: `supabase/schema.sql`.
- Last inspected branch: `master`, with a clean working tree.
- No matching implementation has been written during this planning conversation.

Before implementation:
1. Read `AGENTS.md`.
2. Inspect the current repository and schema again.
3. Create or use `codex/gemini-matching`, checking branch state first.
4. Follow the repository’s Expo documentation requirements before touching Expo or React Native APIs.
5. Verify Gemini SDK/API details against current official documentation.

## Agreed Product Decisions

### Scheduled matching rounds

Do not trigger matching immediately when four users sign up.

Users join a scheduled matching round and select when they are available. At the advertised cutoff, the backend considers everyone waiting in that round.

Example product message:

> Your weekend plans arrive Thursday at 6pm.

For the hackathon, configure a round a few minutes in the future so the automated flow can be demonstrated.

A scheduled backend job initiates matching. A manual development command may exist for testing, but a user-facing button is not the primary trigger.

### Fixed availability slots

Use a small set of concrete, dated slots instead of arbitrary calendars.

Examples:
- Saturday, 10am–noon
- Saturday, 2–4pm
- Sunday, 2–4pm

Store actual dates and timestamps. Display times in `America/Vancouver`.

Users may select multiple slots. An activity must fit entirely inside its selected slot.

### Group sizes and inclusion

- Proposed groups contain 3–5 people.
- Events require 3 accepted invitations to confirm.
- Prefer including an eligible user in a suitable group with space.
- Do not leave someone unmatched merely to create aesthetically balanced groups.
- Leave users unmatched when there is no reasonable activity fit or a hard constraint cannot be satisfied.
- Never add someone after matching without validating them as a member of the group.
- For the MVP, each user may have at most one active pending invitation.

### Event lifecycle

Before matching, users are waiting; no event exists yet.

A valid completed proposal creates a pending event and invitations.

Three accepted invitations confirm the event. If the minimum is not reached by the RSVP deadline, cancel the pending event and release users for a later round.

Unmatched users remain eligible for later rounds whose slots they selected. Do not assume their availability carries over to new dates.

## User Inputs

Collect:
- Interests.
- Optional explicit preferences or free text.
- Selected availability slot IDs.
- Acceptable meeting neighborhoods.
- Budget per event.

Use a clearly defined numeric budget cap in CAD, including a free-only option.

Do not infer personality traits or unstated flexibility. Do not send names, phone numbers, or exact home addresses to Gemini.

## Matching Pipeline

### 1. Start a due round

A scheduler invokes a protected backend worker.

The worker:
- Finds a round whose cutoff has passed.
- Atomically claims it.
- Takes an eligible-user snapshot.
- Prevents concurrent execution of the same round.
- Records completion or failure.

Repeated scheduler invocations must not create duplicate events.

### 2. Build manageable candidate pools

Use code to identify users with shared selected slots and acceptable meeting areas.

For the demo, target approximately 10–15 seeded users. Keep pool size configurable and bounded.

Important:
- Do not pre-group users by interest.
- Gemini chooses group membership.
- A user can be eligible for several slot/area combinations.
- Prefer giving the small demo pool to Gemini together with eligible combinations so it can consider competing assignments.
- If multiple batches are necessary, use deterministic ordering and coordinate assignments across batches.
- Skip combinations with fewer than three eligible users.

Exclude users with active pending invitations or conflicting accepted commitments.

### 3. Ask Gemini to choose groups and activities

Supply:
- Round ID.
- Candidate time slots with start and end timestamps.
- Candidate meeting areas.
- Eligible users.
- Each user’s selected slots, acceptable areas, interests, preferences, and budget.
- A small curated activity catalog.

Each activity should define:
- Stable ID.
- Description.
- Duration.
- Minimum and maximum group size.
- Relevant constraints.
- Venue search category or query.

Gemini must jointly choose:
- Members.
- Activity.
- Time slot.
- Meeting area.

For the MVP, use the slot’s start time as the event start. Derive the end from the activity duration.

Matching priorities:
1. Satisfy all hard constraints.
2. Ensure every member has a reasonable, supported activity fit.
3. Include as many eligible users as possible without forcing unsuitable matches.
4. Consider waiting time as a tie-breaker when recorded.

Explicitly allow unmatched users.

Suggested response:

{
  "groups": [
    {
      "memberIds": ["u1", "u2", "u3"],
      "activityId": "photo_walk",
      "timeSlotId": "slot_1",
      "areaId": "downtown",
      "title": "Downtown Photo Walk",
      "description": "A relaxed walk exploring the neighborhood.",
      "matchReason": "Shared interest in casual outdoor exploration.",
      "memberFit": [
        { "userId": "u1", "reason": "Enjoys photography." },
        { "userId": "u2", "reason": "Enjoys easy walks." },
        { "userId": "u3", "reason": "Wants to explore Vancouver." }
      ]
    }
  ],
  "unmatchedUserIds": ["u4"]
}

Treat member-fit explanations as inspectable rationale, not proof of match quality.

### 4. Validate the grouping response

Use Gemini API-level structured JSON output and runtime validation.

Check:
- Every user, activity, slot, and area ID exists in the supplied input.
- Group sizes satisfy both application and activity limits.
- No user appears in multiple groups.
- No duplicates appear inside a group.
- Every input user appears exactly once, either grouped or unmatched.
- Every member selected the proposed slot and accepts the proposed area.
- The complete activity duration fits within availability.
- Known hard preferences are respected.
- `memberFit` covers exactly the proposed members.
- No conflicting commitments or active pending invitations exist.

### 5. Fetch real venue candidates

For each valid group, fetch candidates from one provider: Google Places or Yelp. Implement one provider first.

Search using activity and proposed area.

Normalize supplied venue data:
- Provider and stable provider ID.
- Name and address.
- Coordinates.
- Relevant categories.
- Opening hours when available.
- Price information when available.

A venue listing does not establish a reservation, capacity, or exact price.

Do not claim unknown facts. If a hard requirement cannot be verified, reject that candidate or use a suitable alternative.

Provide a clearly labeled mock venue adapter for local tests.

### 6. Ask Gemini to finalize the venue

Provide the validated group and supplied venue shortlist.

Gemini selects a supplied venue ID and finalizes the title and description.

It must not change:
- Members.
- Activity.
- Time slot.
- Meeting area.

Validate the venue selection and complete event again.

If no suitable venue exists, do not create that event. Return its users to the unmatched result for this round.

### 7. Persist events and invitations atomically

Save only fully validated proposals.

Requirements:
- Recheck mutable user eligibility inside the transaction.
- Prevent conflicting assignments under concurrent workers.
- Save an event and all its attendee rows together.
- Use stable persisted proposal identities and database uniqueness for idempotency.
- Reuse saved proposals on retries rather than asking Gemini to recreate already saved work.
- Ensure a failure cannot leave a partially saved event.

If external notifications are implemented, send them only after commit and deduplicate delivery. In-app invitations are sufficient for the hackathon.

## Reliability and Failure Handling

- Keep Gemini and venue-provider credentials server-side.
- Use a backend service boundary; never call Gemini directly with a mobile-app secret.
- Use API-level structured output plus runtime schemas.
- Treat profile free text and venue text as data, not instructions.
- Set explicit request timeouts and bounded transient retries.
- Allow one semantic correction attempt per Gemini stage, supplying specific validation errors.
- Do not use unbounded correction or replanning loops.
- If a stage remains invalid, create no events from that invalid response.
- Do not fabricate a fallback event.
- Record actionable errors without logging secrets or unnecessary personal information.
- Ensure failed/stale worker claims can be recovered safely.

## RSVP Behavior

Implement server-side RSVP handling.

Acceptance must:
- Verify that the invitation belongs to the authenticated user.
- Be idempotent.
- Respect the RSVP deadline.
- Reject cancelled events.
- Check conflicting commitments and capacity atomically.
- Confirm the event when accepted attendance reaches three.

Remaining invited users may accept a confirmed event until its deadline, up to capacity.

Declines release the user’s pending invitation.

At the deadline:
- Cancel pending events below the threshold.
- Expire unanswered invitations.
- Keep confirmed events confirmed.

Automatic replacement of declined members and post-confirmation cancellation recovery are outside the initial MVP. Document these limitations.

## Schema Adaptation

Read and extend the actual `supabase/schema.sql`; do not assume other tables already exist.

Current tables:
- `users`: name, phone, area, interests, JSON availability.
- `events`: descriptions, venue fields, date/start time, attendee limits, status.
- `event_attendees`: event/user links and RSVP status.

Add migrations or equivalent schema changes for:
- Scheduled rounds and their execution state.
- Concrete availability slots and user selections.
- Acceptable meeting areas, budget, and preferences.
- Event start and end timestamps.
- Round/proposal identity and idempotency.
- Venue provider and venue ID.
- RSVP deadline.
- Unique `(event_id, user_id)` attendance.
- Appropriate foreign keys, non-null constraints, and status/group-size checks.
- A transactional mechanism for preventing competing user assignments.
- Persistent match results sufficient for safe retries and diagnosis.

Choose the smallest coherent schema. Keep existing fields compatible or migrate them explicitly.

Enforce client/server authorization boundaries. Mobile clients must not be able to generate events or modify other users’ RSVPs directly.

## Implementation Shape

Keep matching logic independent of Expo and UI code.

Suggested responsibilities:
- Input and output schemas.
- Eligibility and pool construction.
- Gemini grouping adapter.
- Venue provider adapter.
- Gemini venue selection adapter.
- Business-rule validation.
- Round orchestration.
- Transactional persistence.
- RSVP handling.
- Scheduler entry point.
- Deterministic mock adapters and fixtures.

Use the existing backend if one has appeared. Otherwise, a Supabase-compatible backend is a reasonable default given the schema.

Keep non-route code outside `src/app/`.

## Hackathon UI

Provide a minimal flow:
1. User supplies matching inputs and selects offered slots.
2. Waiting screen shows the next matching time.
3. Scheduled round runs.
4. User sees an invitation with activity, venue, time, and match explanation.
5. User accepts or declines.
6. Event displays pending or confirmed attendance state.

Use server data as the source of truth.

## Fixtures and Verification

Create deterministic fixtures covering:
- Eight compatible users forming two groups of four.
- A user appropriately left unmatched.
- Fewer than three eligible users.
- Users available in multiple slots without duplicate assignment.
- Activity duration exceeding the slot.
- Invalid IDs and duplicate members.
- Budget or area violations.
- No suitable venue.
- Invalid Gemini output followed by a successful correction.
- Correction failure producing no events.
- Repeated round execution without duplicate events.
- Concurrent assignment attempts.
- Idempotent RSVP acceptance.
- Three acceptances confirming an event.
- RSVP deadline cancellation and invitation expiry.

Mock tests verify orchestration and correctness, not Gemini’s social judgment.

If credentials are available, run a small live smoke test separately. Clearly report if live Gemini or venue calls were not verified.

## Scope Limits

Do not build for this hackathon:
- Arbitrary calendar integrations.
- Travel-time routing.
- A global mathematical optimizer.
- Personality inference.
- Automatic venue reservations.
- Automatic replacement of declined attendees.
- A production recommendation/evaluation platform.

Do retain validation, server-side secrets, transaction safety, and idempotency.

## Completion Criteria

- A configured scheduled round runs without a user pressing Generate.
- Gemini meaningfully chooses members and activities.
- Real-provider mode selects only supplied venue candidates.
- Invalid proposals create no events.
- Suitable users are included when feasible; unmatched users are supported.
- Invitations confirm an event only after three acceptances.
- Repeated execution and concurrent requests do not duplicate events or assignments.
- Deterministic tests pass.
- Repository lint and typecheck pass as required by `AGENTS.md`.
- Setup documentation explains environment variables, schema setup, scheduling, fixtures, and demo execution.
- Final handoff states what was tested and any unverified integrations.
```