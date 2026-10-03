# Gather 🤝

> AI-powered social event creator that brings strangers together in Vancouver.

---

## The Problem

Vancouver is known as one of the loneliest cities in North America. There's no shortage of things to do — but meeting new people is hard. Existing apps like Meetup and Eventbrite require a human organizer to create events first. Most people won't organize, but they *would* show up if someone else did.

**Gather removes the organizer entirely. AI does it.**

---

## What Gather Does

Gather looks at who's available, what they're into, and where they are — then automatically creates a real event at a real local venue and invites the right people.

No one has to plan anything. You just show up.

---

## How It Works

1. **Sign up** — enter your interests, weekly availability, and neighborhood
2. **AI clusters users** — finds groups of people with overlapping schedules and shared interests
3. **AI picks a venue** — searches Google Places and Yelp for a real local spot that fits the group size, activity, and location
4. **AI generates the event** — creates the name, description, date, and time automatically
5. **You get a personalized notification** — "Hey Austin, 6 people near Kitsilano are free Saturday and all like hiking. We found a spot at Jericho Beach at 10am. You in?"
6. **Threshold confirmation** — the event locks in once enough people commit, so you never show up to an empty room
7. **Show up and meet people**

---

## Core Features

### Onboarding
- Pick your interests (hiking, coffee, board games, art, sports, music, and more)
- Set your weekly availability
- Choose your neighborhood in Vancouver
- Set group size preference (small 3–5 or larger 10+)

### AI Event Engine
- Clusters users by shared interests and overlapping free time
- Searches real Vancouver venues via Google Places + Yelp
- Scores venues by distance, rating, capacity, noise level, and price
- Generates a unique event name and description for each group

### Smart Notifications
- Personalized SMS/push notification per user
- Tells you who else is going and why this event was made for you
- One-tap confirm

### Threshold Booking
- Event only confirms when minimum attendees commit
- Live spot counter creates urgency ("4 of 6 spots filled")
- If threshold isn't met, event is cancelled — no awkward turnouts

### Post-Event Learning
- After the event, AI asks how it went
- Learns what you actually enjoyed vs. what you said you would
- Gets smarter at matching you with the right people and events over time

---

## Tech Stack

| Layer | Tool |
|---|---|
| Mobile | React Native + Expo |
| AI Engine | OpenAI GPT-4o |
| Venue Search | Google Places API + Yelp API |
| Notifications | Twilio SMS + Expo Push Notifications |
| Backend | Node.js / Express |
| Database | Supabase |
| Auth | Clerk |

---

## Getting Started

### Prerequisites
- Node.js 18+
- The [Expo Go](https://expo.dev/go) app on your phone (easiest), or an Android emulator / iOS simulator

### Install
```bash
npm install
```

### Run
Start the Expo dev server:
```bash
npx expo start
```
Then open the app one of these ways:

- **On your phone** — scan the QR code in the terminal with the **Expo Go** app (Android) or the Camera app (iOS). Phone and computer must be on the same Wi-Fi.
- **Web browser** — press `w` in the terminal
- **Android emulator** — press `a` (requires Android Studio)
- **iOS simulator** — press `i` (requires macOS + Xcode)

Shortcut scripts are also available:
```bash
npm run android   # start + open Android
npm run ios       # start + open iOS (requires macOS)
npm run web       # start + open web
```

> This project uses **Expo Router** — screens live in `src/app/`. The app runs in Expo Go with no native build required. (A development build is only needed later if you add a library with custom native code, e.g. push notifications.)

### Environment Variables
Create a `.env` file in the root:
```
OPENAI_API_KEY=
GOOGLE_PLACES_API_KEY=
YELP_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SUPABASE_URL=
SUPABASE_ANON_KEY=
CLERK_PUBLISHABLE_KEY=
```

---

## Hackathon Demo Flow

1. Show 3 user profiles with different interests and availability
2. Hit "Generate Events" — AI creates events live with real Vancouver venues
3. Show the personalized notification each user receives
4. One user confirms — watch the event lock in
5. Show how the preference profile updates after a post-event debrief

---

## Built by Austin Luk
