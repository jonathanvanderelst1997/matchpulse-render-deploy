# MatchPulse

Luxury AI dating prototype with a consent-first onboarding flow, living AI profile memory, local test accounts, invite links, match scoring, messages, plans, settings, and private profile export.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Use `http://127.0.0.1:5173/?resetAuth=1` to restart the onboarding flow.

## Production-Style Run

```bash
npm run build
npm start
```

`npm start` serves both the API and the built frontend from the same Node server. This is the path used by `render.yaml`.

## Test With Other Devices On Your Network

```bash
npm run dev:lan
```

Then open the Network URL printed by Vite on another phone or laptop connected to the same Wi-Fi. For real external testers outside your network, deploy the app or use a tunnel.

## Zero-Cost Mode

MatchPulse is configured to run without paid APIs:

- AI profile insight falls back to the built-in local heuristic when `OPENAI_API_KEY` is empty.
- Sunday Match Briefings are saved as local/in-app previews when `RESEND_API_KEY` is empty.
- Signup verification and password reset emails use the same local-preview/Resend behavior; local previews include a test link in the Dev screen, while public beta should use Resend.
- Local development stores state in `server/matchpulse-db.json` and uploads in `server/uploads`.
- Public beta persistence can use Supabase Free for Auth, state, and Storage.
- The included Render blueprint uses `plan: free`; free services can sleep and are for beta testing, not production scale.

## What Works Now

- Simulated Google, Apple, and email account start.
- Animated AI pulse onboarding.
- Profile creation with text, preferences, and photos.
- Local profile photo uploads stored as files under `server/uploads`.
- Local invite links for creating more test accounts.
- Persistent local JSON database at `server/matchpulse-db.json`.
- Recalculated match scores across seed profiles and created users.
- AI memory add/delete with local heuristic insight and optional OpenAI env support.
- Live neural mind map in the profile tool.
- Favorites, hide/restore matches, filters, search, and sorting.
- Messages and date plans saved through the API.
- Match feedback, report/block, and local safety review records.
- Sunday briefing, signup verification, and password reset preview creation, with real Resend delivery when email env vars are present.
- Privacy toggles, linked tool toggles, private profile export, and beta account deletion.
- Supabase migrations, env template, and beta runbook.
- Production server/static hosting path plus Render blueprint.
- Beta Lab dashboard for testers, invites, feedback, reports, blocks, and briefings.
- Optional Supabase OAuth flow for Google/Apple login when public Supabase env vars are set.
- Optional Supabase state persistence and profile photo storage for production beta.

## Free Public Beta Files

- `.env.example` lists the free Supabase path and optional email/AI upgrades.
- `.env.free.example` is the strict zero-cost public beta template for Render + Supabase Free.
- `supabase/migrations/0001_matchpulse_beta.sql` creates the beta schema with RLS and indexes.
- `supabase/migrations/0003_memory_consent.sql` adds memory visibility/consent fields for older Supabase projects.
- `docs/beta-runbook.md` gives the local, LAN, production, and safety test steps.
- `docs/zero-cost-launch.md` gives the exact zero-cost deploy route.
- `docs/agent-handoff-public-free-beta.md` is the copy-ready handoff for another agent.
- `render.yaml` is a free-plan deploy blueprint for the Node/Vite app.

## Still Needed For Free Public Beta

- Create a free Supabase project and fill the Supabase env vars.
- Set `MATCHPULSE_DATA_PROVIDER=supabase` after running both Supabase migrations.
- Set `MATCHPULSE_STORAGE_PROVIDER=supabase` after the `profile-photos` bucket exists.
- Configure Google/Apple providers in Supabase Auth and set both `SUPABASE_*` and `VITE_SUPABASE_*` env vars.
- Deploy the app and set `MATCHPULSE_PUBLIC_URL`.
- Keep `OPENAI_API_KEY` empty for zero-cost local AI.
- For zero-cost beta confirmation, use `MATCHPULSE_EMAIL_PROVIDER=supabase`, `MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1`, and `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=0`.
- For stronger mailbox delivery later, add a verified sender domain/SMTP, set `MATCHPULSE_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MATCHPULSE_FROM_EMAIL`, and switch `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=1`.
- Add moderation dashboard workflows for report review.
- Evaluate match scoring quality with real beta feedback.

## Production Readiness Check

With the app running:

```bash
npm run readiness
```

This checks `/api/health`, provider readiness, required free public-beta env vars, and optional OpenAI/Resend upgrades.
OpenAI and Resend are not required for zero-cost mode.

For deployed free beta verification, use the strict check:

```bash
MATCHPULSE_TEST_API=https://your-free-render-url.onrender.com npm run readiness:public-free
```
