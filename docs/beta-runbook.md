# MatchPulse Beta Runbook

Read [deployment-topology.md](deployment-topology.md) before any production, repository, Render or Supabase action. The private repository is canonical, while the current practical public ingress is sourced from a separate public deploy repository. Do not change that topology from this runbook.

## Local beta

1. Run `npm run dev`.
2. Open `http://127.0.0.1:5173/?resetAuth=1`.
3. Create two or more local accounts with different names and profiles.
4. Use Settings → Invite testers to copy a local invite link.
5. Use AI Profile Tool to add memories and watch the neural map change.
6. Test safety: More actions → Report and block.
7. Test signup verification and password reset from the Dev screen. Without delivery keys this saves local preview links; with a configured provider it sends real email.
8. Test Sunday Briefing → Send test briefing. Without delivery keys this saves a local preview; with a configured provider it sends.
9. Open Beta Lab to inspect tester, feedback, report, block, auth email, and briefing totals.

## LAN beta

1. Run `npm run dev:lan`.
2. Copy the Vite Network URL.
3. Share it only with devices on the same Wi-Fi.
4. Each tester should start with `?resetAuth=1` if they used an older local session.

## Migration plan verification

Before any build or Supabase action:

```bash
npm run verify:migration-plan
```

The repository must contain exactly one SQL migration for every required prefix:

1. `0001`
2. `0002`
3. `0003`
4. `0004`
5. `0005`

Use the actual filenames in `supabase/migrations/` and apply them in lexical order. Do not skip a prefix, apply a later migration first, or infer execution from matching schema alone.

The last read-only hosted migration query returned an empty list. That means there is no hosted migration-history proof for `0001` through `0005`; it does not prove that the schema is absent or present.

## Production beta preparation

These steps prepare evidence. They do not authorize a cutover.

1. Confirm the exact Supabase project label and owner role without opening credentials, Auth users, table rows, Storage objects or logs.
2. Run `npm run verify:migration-plan` and record the five discovered filenames.
3. Determine, without modifying the project, whether migrations `0001`, `0002`, `0003`, `0004` and `0005` have ordered execution evidence.
4. Only after explicit database approval, apply any genuinely missing migration in lexical order. Never re-run a migration merely because hosted history is empty.
5. With the intended runtime configured, request `/api/schema-status`. Confirm the state snapshot, attention learning, tester feedback, match scores and profile visibility consent relations are reachable.
6. Treat `/api/schema-status` as relation-readiness evidence only. It does not prove migration history, traffic ownership or data integrity.
7. Enable only approved Google or Apple providers in Supabase Auth.
8. Add only the confirmed deployed URL as an allowed redirect URL.
9. Confirm the `profile-photos` bucket and required policies without opening file contents.
10. Add environment categories from `.env.example` through the provider dashboard; never copy values into documentation or chat.
11. Set `MATCHPULSE_DATA_PROVIDER=supabase` and `MATCHPULSE_STORAGE_PROVIDER=supabase` only for the service proven to use that project.
12. Leave `OPENAI_API_KEY` empty for zero-cost local AI insight unless paid AI is explicitly approved.
13. Keep `MATCHPULSE_EMAIL_PROVIDER=supabase`, `MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1`, and `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=0` for low-volume zero-cost beta verification unless a verified sender route is approved.
14. Configure Resend only after a sender domain and owner role are verified.
15. Treat `render.yaml` as a private-source reference blueprint. Do not use it to replace, repoint or recreate the current public ingress.
16. Run the strict readiness and smoke checks only against a target whose role has been confirmed.

```bash
MATCHPULSE_TEST_API=https://confirmed-target.example npm run readiness:public-free
MATCHPULSE_TEST_API=https://confirmed-target.example MATCHPULSE_TEST_WEB=https://confirmed-target.example npm run smoke
```

## Evidence required before inviting external testers

- The public URL and traffic route are confirmed.
- The deployment-to-Supabase binding is confirmed.
- Ordered migration state for `0001` through `0005` is recorded.
- Auth signup, verification, login, logout and password reset work end to end.
- Profile photo upload, read and delete work with the intended Storage policies.
- A tester can delete/export their private profile data.
- A rollback target and rollback owner are named and tested.
- No local-only `src/App.jsx` delta is being mistaken for deployed source.

## Strict zero-cost rules

- Do not set `OPENAI_API_KEY`; the app will use the deterministic local AI memory model.
- Use the approved free email path for real public-beta account verification; keep local previews limited to local/LAN testing.
- Use Supabase Free only after the target project and migration state are confirmed.
- Use Render Free only for a chosen beta route; expect cold starts after inactivity.
- Keep beta media small because free storage and bandwidth have limits.
- Export/delete test data through approved product flows; free tiers are not a long-term production compliance plan.

## Safety checklist

- Users can delete memory notes.
- Users can export their private profile.
- Users can block/report a match.
- Hidden matches can be restored.
- Weekly briefing can be disabled.
- Location is fuzzed by default.
- Account deletion clears the intended private data.
- Beta Lab shows reports/feedback/auth emails/briefings for authorized review.
- No profile, message, Auth record, upload or tester identity is copied into GitHub documentation.

## Beta success metrics

- Profile completion rate.
- Invite acceptance rate.
- AI memory notes per user.
- Match feedback count.
- Intro/message rate.
- Date plan creation rate.
- Report/block rate.
