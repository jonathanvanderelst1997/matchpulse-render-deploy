# MatchPulse Zero-Cost Launch Reference

This document describes a possible zero-cost beta architecture. It is not authority to replace the current public ingress, repoint a Render service or modify a Supabase project. Read [deployment-topology.md](deployment-topology.md) first.

## Reference architecture

- Frontend and API: one confirmed Render Free web service using the private canonical source.
- Auth: Supabase Free Auth, with providers enabled only after redirect and owner review.
- Database: Supabase Free using the MatchPulse schema and state structures.
- Photo storage: Supabase Free Storage bucket `profile-photos` with verified policies.
- AI: built-in local heuristic, no OpenAI key.
- Email: an approved free verification route; local previews are limited to local/LAN tests.

The present system has two repositories and two Render services. This reference becomes actionable only after traffic, data-provider binding, migration execution and rollback evidence are complete.

## Environment categories

Use `.env.free.example` as a checklist inside the approved provider dashboard. Never paste values into documentation, issues, pull requests or chat.

Required categories for a selected public beta route include:

```bash
MATCHPULSE_PUBLIC_URL=
MATCHPULSE_DATA_PROVIDER=supabase
MATCHPULSE_STORAGE_PROVIDER=supabase
MATCHPULSE_STATE_ID=beta
MATCHPULSE_STORAGE_BUCKET=profile-photos
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_MATCHPULSE_OAUTH_PROVIDERS=
MATCHPULSE_EMAIL_PROVIDER=supabase
MATCHPULSE_FROM_EMAIL=
MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1
MATCHPULSE_REQUIRE_EMAIL_DELIVERY=0
```

Keep this empty for strict zero-cost mode:

```bash
OPENAI_API_KEY=
```

## Migration order

Run this check locally before any build or database decision:

```bash
npm run verify:migration-plan
```

The repository must expose exactly one SQL file for each required prefix `0001`, `0002`, `0003`, `0004` and `0005`. Use the actual filenames and apply them only in lexical order against the confirmed target project.

The last read-only hosted migration list was empty. Do not respond by blindly executing all five files. First compare the target schema, migration history, application readiness and rollback plan. A matching schema is relation evidence, not ordered execution proof.

## Preparation order

1. Confirm which Render URL is intended to become the public route.
2. Confirm which Supabase project is bound to that service.
3. Run `npm run verify:migration-plan`.
4. Establish the execution state of migrations `0001` through `0005` without reading user data.
5. Obtain explicit approval before applying a missing migration.
6. Verify `/api/schema-status` on the intended runtime.
7. Verify Auth redirect URLs, signup, verification, login, logout and reset.
8. Verify `profile-photos` upload, read and delete behavior with the intended policies.
9. Confirm the email provider and sender-domain status.
10. Run `npm run lint`, `npm run smoke`, `npm run build` and `npm run readiness` locally.
11. Run strict readiness and smoke only against the confirmed deployment target.
12. Name and test a rollback target before external tester invitations.
13. Obtain explicit cutover approval before changing traffic, services or repository roles.

## Verification commands

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
MATCHPULSE_TEST_API=https://confirmed-target.example MATCHPULSE_TEST_WEB=https://confirmed-target.example npm run smoke
```

## Limits to respect

- Render Free can sleep after inactivity, so first load can be slow.
- Supabase Free has storage, database and Auth limits; keep early beta small.
- Local AI is deterministic and cheap, but not as nuanced as paid model calls.
- Free email limits and sender requirements still apply.
- Free tiers are not a long-term production compliance, backup or recovery plan.
- Never use real profile or message content as deployment evidence.

## Upgrade later

Only add paid services after the product proves people want it and the owner/recovery path is known:

- OpenAI API for richer memory analysis.
- A verified transactional email provider for reliable delivery.
- Paid hosting/database once cold starts, limits, backups or support requirements justify it.
