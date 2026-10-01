# Agent Handoff: MatchPulse Beta Reconciliation

This is an operational handoff for the private canonical repository. It does not authorize a deployment, database change or cutover.

## Objective

Prepare MatchPulse for a safe beta route while preserving the current topology until evidence is complete:

- private `jonathanvanderelst1997/matchpulse` remains the canonical source;
- public `jonathanvanderelst1997/matchpulse-render-deploy` remains current-ingress exposure and rollback evidence, not canonical source;
- both existing Render services remain unchanged;
- the Supabase target, migration execution, traffic and rollback roles must be proven before any architecture decision.

Read [deployment-topology.md](deployment-topology.md) and the private central MatchPulse record before substantial work.

## Non-negotiables

- Do not copy future source changes into the public deploy repository.
- Do not change repository visibility, Render source, service state, traffic, custom domains or environment configuration without explicit approval.
- Do not run a Supabase migration, edit Auth/Storage, change a bucket policy or open user/data views without explicit database/account approval.
- Never paste or expose `SUPABASE_SERVICE_ROLE_KEY`, environment values, profiles, messages, uploads, Auth records or tester data.
- Keep `OPENAI_API_KEY` empty unless paid AI is explicitly approved.
- Maintain memory and attention consent: private signals must not be shown to other users.
- Preserve the separately recorded local `src/App.jsx` delta until its own review decision.
- Treat a merge to private `main` as a possible live action because the secondary Render service may auto-deploy it.

## Files to know

- `AGENTS.md`: canonical routing and stop boundaries.
- `docs/deployment-topology.md`: current dual-repository, dual-service and rollback state.
- `.env.free.example`: strict free public-beta environment categories.
- `render.yaml`: private-source reference blueprint, not current-ingress authority.
- `server/readiness-check.mjs`: readiness and strict public-beta checks.
- `server/migration-plan-check.mjs`: verifies required migration files and documentation.
- `server/api.mjs`: local/Supabase state, Auth bridge, storage, matching and consent.
- `src/supabaseAuth.js`: browser OAuth helper.
- `supabase/migrations/`: one ordered SQL file for each prefix `0001`, `0002`, `0003`, `0004` and `0005`.
- `docs/zero-cost-launch.md`: reference launch design.
- `docs/beta-runbook.md`: preparation, evidence and QA steps.

## Required local verification

```bash
npm run verify:migration-plan
npm run lint
npm run smoke
npm run build
npm run readiness
```

Use deployed checks only after the exact target role is confirmed:

```bash
MATCHPULSE_TEST_API=https://confirmed-target.example npm run readiness:public-free
MATCHPULSE_TEST_API=https://confirmed-target.example MATCHPULSE_TEST_WEB=https://confirmed-target.example npm run smoke
```

## Migration evidence rule

1. Confirm the target Supabase project without opening credentials or user data.
2. Verify one file exists for each prefix `0001` through `0005`.
3. Establish ordered execution evidence.
4. Use `/api/schema-status` to verify required relations are reachable.
5. Do not equate matching schema or an empty hosted migration list with permission to run all files.
6. Apply a genuinely missing migration only after explicit approval and a rollback/data-integrity plan.

## Browser QA flow

Use only test identities in a confirmed environment.

1. Open the confirmed deployed URL.
2. Create or sign in with a test account.
3. Verify the approved email flow.
4. Complete onboarding.
5. Confirm provider/readiness status without exposing values.
6. Copy an invite link.
7. Open the invite in a private/new browser context.
8. Create and verify a second test account.
9. Confirm both accounts appear in Radar/Deep Match.
10. Open a match profile.
11. Add AI memory, change visibility, reload and confirm persistence.
12. Exercise message, date plan, report/block and profile export flows.
13. Verify profile-photo upload/read/delete.
14. Verify account deletion removes the intended test data.
15. Check desktop/mobile behavior and console errors.

## Evidence before a cutover proposal

- Current traffic URL and external links.
- Deployment-to-data-provider binding for both services.
- Ordered migration evidence for `0001`, `0002`, `0003`, `0004` and `0005`.
- Auth, Storage and email status categories.
- Local `src/App.jsx` delta disposition.
- Passing local checks and confirmed-target checks.
- Named rollback target, owner and data-integrity verification.
- A documented choice between a separated public build-artifact repository and a fully private deployment path.

## Expected handoff result

The result is not “deployed”. It is a decision-ready evidence pack containing only privacy-safe categories, exact source commits, check results, blockers, rollback evidence and the explicit approval still required. Use `TE VERIFIËREN` instead of assumptions.
