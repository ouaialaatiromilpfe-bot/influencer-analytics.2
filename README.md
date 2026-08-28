# Influencer Performance Analytics

Next.js 14 (App Router) + Tailwind CSS app that analyzes real view performance,
follower counts, and posting activity for YouTube channels and Instagram
profiles. Built to deploy on **Netlify**.

## ⚠️ Read before deploying — the one thing you must verify

The Instagram side calls an **Apify** actor (`lib/apify.ts`,
`app/api/instagram/*`) to scrape public profile data. The field-name mapping
in `lib/apify.ts` (`normalizeApifyItem` / `normalizeApifyProfile`) was written
against the commonly-documented output shape of `apify/instagram-scraper`,
**not** against a real sample JSON from your own account, because none was
available while this was generated.

Before you trust any Instagram numbers in production:

1. Run the actor once by hand in the Apify console against a public test profile.
2. Open the dataset's JSON output.
3. Compare field names (views/likes/comments/timestamp/caption/etc.) against
   the `pick(...)` calls in `lib/apify.ts` and adjust them if they don't match.
4. Set `APIFY_ACTOR_ID` in your environment to the exact actor you want billed
   (format `username~actor-name`) — see `.env.example`.

Nothing will silently look "fine" if this is wrong — mismatched fields will
mostly show up as `0` or `—` values, which is your cue to go check the mapping.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys if you want server-side fallbacks
npm run dev
```

Open http://localhost:3000.

## Deploying to Netlify

1. Push this repo to GitHub/GitLab/Bitbucket, or drag-and-drop the folder into
   Netlify's UI.
2. In Netlify: **New site from Git** → pick the repo. Build command and
   publish directory are already set in `netlify.toml`
   (`next build` / `.next`), and `@netlify/plugin-nextjs` is configured so
   `app/api/*` routes deploy as Netlify Functions automatically — you do not
   need a separate `netlify/functions` folder.
3. Go to **Site settings → Environment variables** and add:
   - `YOUTUBE_API_KEY` (optional — server-side fallback)
   - `APIFY_TOKEN` (optional — server-side fallback)
   - `APIFY_ACTOR_ID` (optional — defaults to `apify~instagram-scraper`)
4. Deploy. If you skip step 3 entirely, the app still works as long as every
   visitor pastes their own YouTube API key / Apify token in the collapsible
   fields on each tab.

## How the two platforms differ

- **YouTube**: uses your key (or the server fallback) to call the YouTube
  Data API v3 directly and synchronously — `channels.list` →
  `playlistItems.list` (uploads playlist, paginated with **no cap** — the
  entire upload history is fetched) → `videos.list` (batched, 50 IDs per
  call) for view counts and durations.

  ⚠️ Two real limits to know about, since there is no cap anymore:
  - **YouTube API daily quota** (10,000 units/day by default). A channel
    with a very large upload history can burn through this in one fetch.
    If quota runs out mid-fetch, the app shows the real YouTube error and
    how many videos it got through before failing — it does not silently
    return a partial or fake result.
  - **Serverless function execution time limit** (10s on Vercel Hobby / 10s
    default on Netlify, higher on paid plans). Very large channels
    (roughly 1,000+ videos) may hit this timeout before YouTube's quota
    even becomes an issue. If you hit this in practice, either upgrade to
    a paid Vercel/Netlify plan (longer function timeouts), or re-introduce
    a cap in `app/api/youtube/route.ts` (the `MAX_PAGES` constant and the
    `videoIds.length < N` guards that were removed).
- **Instagram**: Apify actor runs are asynchronous and can take well past
  Netlify's function timeout, so the flow is split into three endpoints:
  `POST /api/instagram/start` → `GET /api/instagram/status?runId=...`
  (polled every ~4s from the browser) → `GET /api/instagram/result?datasetId=...`.
  The UI shows a persistent progress message the whole time, never a bare
  spinner.

## No silent mock data

Sample data only ever appears when someone clicks **"Try Demo Data"**, and a
banner reading "⚠️ Showing sample data — not a real account." is shown the
entire time it's on screen. Any real fetch failure (invalid handle, private
account, quota exceeded, malformed response, missing key) surfaces the actual
upstream error text in a red banner — it never falls back to fake numbers.
All Netlify Function errors are also logged with full detail via
`console.error`, visible in the Netlify Functions log dashboard.

## Data & storage

- Each search caches everything fetched (up to 100 Instagram posts, or the
  channel's full YouTube upload history) in React state for the current
  session; the N selector only re-slices that cached array — it never
  triggers a new API call or a new Apify run.
- Search history (handle, platform, followers, last active date, N-average,
  lowest view count) is stored in **`localStorage`** only. There is no
  backend database, and this is stated in the UI.
- CSV export (both "selected result" and "all saved influencers") happens
  entirely client-side via `Blob` + `URL.createObjectURL` — no server
  round-trip, no pre-filled Google Sheets link (Sheets doesn't support that
  without OAuth, which is out of scope here).

## Project structure

```
app/
  api/youtube/route.ts              YouTube Data API v3 integration
  api/instagram/start/route.ts      Kicks off an Apify actor run
  api/instagram/status/route.ts     Polled run-status endpoint
  api/instagram/result/route.ts     Fetches + normalizes the Apify dataset
  page.tsx                          Tab shell + search history
  layout.tsx / globals.css          Lavender theme, fonts
components/
  YouTubeTab.tsx / InstagramTab.tsx Per-platform input + fetch flow
  ProfileResults.tsx                Shared stats dashboard (N-slicing, etc.)
  UploadsGrid.tsx                   Thumbnail grid with checkoff state
  SearchHistoryTable.tsx            localStorage-backed history + CSV export
  DemoBanner.tsx / ErrorBanner.tsx  Mandatory-visibility state banners
  icons/PixelIcons.tsx              Tamagotchi/8-bit SVG icon set
lib/
  types.ts, analytics.ts, format.ts, csv.ts, storage.ts, demoData.ts, apify.ts
```
