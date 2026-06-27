# Agent Handoff: MatchPulse Public Free Beta

Use this handoff after the user has created the Supabase Free project and Render Free service.

## Objective

Make MatchPulse work as a public, zero-cost beta:

- Render Free hosts the Node/Vite app.
- Supabase Free handles Auth, the state snapshot table, and profile photo storage.
- No paid OpenAI calls.
- Resend Free handles real account verification, password reset, and briefing email.
- Invite links create real test accounts that appear in matching.

## Non-Negotiables

- Keep `OPENAI_API_KEY` empty unless the user explicitly chooses paid AI.
- Set `RESEND_API_KEY`, `MATCHPULSE_FROM_EMAIL`, `MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1`, and `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=1` before inviting public testers.
- Do not paste or expose `SUPABASE_SERVICE_ROLE_KEY` in chat.
- Keep `render.yaml` on `plan: free`.
- Maintain memory consent: private memories must not be shown to other users.

## Files To Know

- `.env.free.example`: strict free public beta env template.
- `render.yaml`: Render Free deploy blueprint.
- `server/readiness-check.mjs`: readiness and strict public-free-beta checks.
- `server/api.mjs`: local/Supabase state, auth bridge, storage, matching, memory consent.
- `src/supabaseAuth.js`: browser OAuth helper.
- `supabase/migrations/0001_matchpulse_beta.sql`
- `supabase/migrations/0002_matchpulse_state_snapshot.sql`
- `supabase/migrations/0003_memory_consent.sql`
- `docs/zero-cost-launch.md`
- `docs/beta-runbook.md`

## Required Verification Commands

Run locally after env is configured:

```bash
npm run build
npm run lint
npm run smoke
npm run readiness
```

Run against the deployed Render URL:

```bash
MATCHPULSE_TEST_API=https://your-free-render-url.onrender.com npm run readiness:public-free
MATCHPULSE_TEST_API=https://your-free-render-url.onrender.com MATCHPULSE_TEST_WEB=https://your-free-render-url.onrender.com npm run smoke
```

## Browser QA Flow

Use the in-app browser if available.

1. Open deployed URL.
2. Create or sign in with a test account.
3. Verify the email from the received Resend message.
4. Complete onboarding.
5. Open Settings and confirm zero-cost AI plus Resend email status.
6. Copy invite link.
7. Open invite in private/incognito/new browser context.
8. Create and verify second account.
9. Confirm both accounts appear in Radar/Deep Match.
10. Click a radar profile and confirm profile detail opens.
11. Add AI memory, change visibility, reload, confirm persistence.
12. Send message, plan date, report/block, export profile.
13. Check desktop and mobile viewport, console errors, and no framework overlay.

## Expected Result

The beta is public and free:

- `providerStatus.costMode` is `zero-cost`.
- Public free beta env vars are ready.
- Login works.
- Signup verification and password reset emails deliver.
- Invite links work.
- Profile photos persist.
- Memories persist with visibility.
- Smoke test passes.
- No paid API keys are required.
