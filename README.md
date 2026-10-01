# MatchPulse

Luxury AI dating prototype with a consent-first onboarding flow, living AI profile memory, local test accounts, invite links, match scoring, messages, plans, settings, and private profile export.

## Source and deployment boundary

- Private `jonathanvanderelst1997/matchpulse` is the canonical source repository.
- Public `jonathanvanderelst1997/matchpulse-render-deploy` is the source currently observed behind the practical public ingress; it is not the canonical private source.
- Two Render services remain intentionally frozen until traffic, data-provider binding, migration execution and rollback ownership are proven.
- Read [the deployment topology](docs/deployment-topology.md) before changing a repository, service, migration or deployment route.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Use `http://127.0.0.1:5173/?resetAuth=1` to restart the onboarding flow.

## Production-style run

```bash
npm run build
npm start
```

`npm run build` first verifies that the repository contains one ordered migration for every prefix `0001`, `0002`, `0003`, `0004` and `0005`, and that the operational documentation covers the same plan.

`npm start` serves both the API and the built frontend from the same Node server. This is the path described by `render.yaml`; the blueprint is not evidence of the current public-ingress configuration.

## Test with other devices on your network

```bash
npm run dev:lan
```

Then open the Network URL printed by Vite on another phone or laptop connected to the same Wi-Fi. For real external testers outside your network, use only a confirmed deployment target.

## Zero-cost mode

MatchPulse is configured to run without paid APIs:

- AI profile insight falls back to the built-in local heuristic when `OPENAI_API_KEY` is empty.
- Sunday Match Briefings are saved as local/in-app previews when `RESEND_API_KEY` is empty.
- Signup verification and password reset emails use the same local-preview/Resend behavior; local previews include a test link in the Dev screen, while public beta should use a verified delivery route.
- Local development stores state in `server/matchpulse-db.json` and uploads in `server/uploads`.
- Public beta persistence can use Supabase Free for Auth, state, and Storage.
- The included Render blueprint uses `plan: free`; free services can sleep and are for beta testing, not production scale.

## What works now

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
- Sunday briefing, signup verification, and password reset preview creation, with real delivery when configured.
- Privacy toggles, linked tool toggles, private profile export, and beta account deletion.
- Supabase migrations, env templates, schema-status endpoint and beta runbook.
- Production server/static hosting path plus Render blueprint.
- Beta Lab dashboard for testers, invites, feedback, reports, blocks, and briefings.
- Optional Supabase OAuth flow for Google/Apple login when public Supabase env vars are set.
- Optional Supabase state persistence and profile photo storage for production beta.

## Free public-beta files

- `.env.example` lists the free Supabase path and optional email/AI upgrades.
- `.env.free.example` is the strict zero-cost public beta template for Render + Supabase Free.
- `supabase/migrations/` contains one SQL file for each ordered prefix `0001`, `0002`, `0003`, `0004` and `0005`.
- `server/migration-plan-check.mjs` rejects missing, duplicated or undocumented required migration prefixes.
- `docs/beta-runbook.md` gives the local, LAN, production, migration-evidence and safety test steps.
- `docs/zero-cost-launch.md` is a reference launch design, not authority to replace the current ingress.
- `docs/agent-handoff-public-free-beta.md` is the privacy-safe operational handoff.
- `docs/deployment-topology.md` records the current dual-repository and dual-service boundary.
- `render.yaml` is a free-plan private-source blueprint for the Node/Vite app.

## Still needed before a public-beta cutover

- Confirm the exact target Supabase project before any migration action.
- Establish ordered execution evidence for migrations `0001` through `0005`; matching schema alone is insufficient.
- Verify Auth and Storage end to end without recording users, objects or credentials.
- Confirm which Render service receives traffic and which data provider each service uses.
- Name and test the rollback target and rollback owner.
- Review the separately recorded local `src/App.jsx` delta.
- Choose a separated public build-artifact repository or a fully private deployment path.
- Keep `OPENAI_API_KEY` empty for zero-cost local AI unless paid AI is explicitly approved.
- Add moderation dashboard workflows for report review.
- Evaluate match scoring quality with real beta feedback.

## Verification

```bash
npm run verify:migration-plan
npm run lint
npm run smoke
npm run build
npm run readiness
```

For a confirmed deployed target only:

```bash
MATCHPULSE_TEST_API=https://confirmed-target.example npm run readiness:public-free
```

The readiness and schema-status checks prove reachability and expected configuration categories; they do not prove traffic ownership, migration history or rollback readiness.

## Health and outage behaviour

- `GET /api/live` answers 200 while the process runs and never touches Supabase.
- `GET /api/health` reads the state (so it keeps a free Supabase project active) and answers 200 only when the state really comes from the configured provider. When Supabase is paused (HTTP 540), restricted by Fair Use (402), rejects the key (401/403), times out or is unreachable, it answers 503 with the reason under `dependencies.supabase` (`supabase_paused`, `supabase_restricted`, `supabase_key_rejected`, `supabase_timeout`, `supabase_unreachable`, `supabase_unavailable`). `MATCHPULSE_DATA_PROVIDER=supabase` without `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` is reported as `misconfigured` (503).
- Supabase calls time out after `MATCHPULSE_SUPABASE_TIMEOUT_MS` (default 10000) and transient failures (timeouts, network errors, 5xx, 429) are retried `MATCHPULSE_SUPABASE_RETRIES` times (default 2) with backoff. A paused, restricted or key-rejected project is not retried.
- During a Supabase outage, reads are served from the last state this process loaded, marked with the `X-MatchPulse-Degraded` header; writes are refused with 503 `database_unavailable` and nothing is saved. A process that starts while Supabase is down has no copy and answers 503.
- The browser keeps the session on a temporary outage (network error, 5xx, 503) and retries; it only signs out on 401.
- `npm run test:resilience` exercises all of this against a local mock Supabase.
