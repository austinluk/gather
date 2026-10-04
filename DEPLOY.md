# Deploying Gather

Two pieces to host: the **backend** (Node/Express — needs a server) and the
**web app** (static files → gatherapp.tech). The web app must talk to the
backend over **HTTPS** (a browser blocks an HTTPS page calling an HTTP URL).

---

## 1. Backend → Render

1. Make sure the repo is pushed to GitHub.
2. Render → **New → Blueprint** → pick this repo → it reads `render.yaml`.
3. When prompted, paste the secret env vars (NOT in the repo):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GOOGLE_PLACES_API_KEY`
   - (`GEMINI_MODEL` and `USE_MOCK_VENUES` are already set in the blueprint)
4. Deploy → note the URL, e.g. `https://gather-backend.onrender.com`.
5. Verify: open `https://<your-backend>/health` → should return `{"ok":true,...}`.

> Free tier sleeps after ~15 min idle; the first request cold-starts (~30s).
> Hit `/health` right before demoing to wake it.

## 2. Point the app at the backend

In `.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://<your-backend>.onrender.com
```
(Keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as-is.)

## 3. Build the web

```
npx expo export --platform web      # outputs dist/
```

## 4. Deploy the web → gatherapp.tech

Pick one host and deploy the `dist/` folder:

- **Netlify:** `npx netlify deploy --prod --dir dist` (or drag `dist/` into app.netlify.com).
- **Vercel:** `npx vercel deploy --prod dist`.
- **Cloudflare Pages:** upload `dist/`.

Then in the host's dashboard add the custom domain **gatherapp.tech** — the host
will show you the exact DNS record (an A record or a CNAME). Add that record in
your registrar's **Namify → DNS** tab. HTTPS is issued automatically by the host.

(`public/_redirects` makes client-side routing work on Netlify / Cloudflare Pages.)

## 5. Supabase

Auth → **URL Configuration** → add `https://gatherapp.tech` to **Site URL** and
**Redirect URLs** (so email confirmation returns to the site). For a frictionless
demo, you can also turn off "Confirm email".

---

## iPhone

Once live, just open **https://gatherapp.tech in Safari** — it's HTTPS, so no
firewall, same-Wi-Fi, Expo Go, or iOS-HTTP issues. The whole demo works.

## Security

Rotate the Supabase + Gemini keys that were shared in chat; set the fresh values
in Render's env vars and in your local `.env`.
