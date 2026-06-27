# MatchPulse Beta Runbook

## Local Beta

1. Run `npm run dev`.
2. Open `http://127.0.0.1:5173/?resetAuth=1`.
3. Create two or more local accounts with different names and profiles.
4. Use Settings → Invite testers to copy a local invite link.
5. Use AI Profile Tool to add memories and watch the neural map change.
6. Test safety: More actions → Report and block.
7. Test signup verification and password reset from the Dev screen. Without Resend keys this saves local preview links; with Resend keys it sends real email.
8. Test Sunday Briefing → Send test briefing. Without Resend keys this saves a local preview; with Resend keys it sends.
9. Open Beta Lab to inspect tester, feedback, report, block, auth email, and briefing totals.

## LAN Beta

1. Run `npm run dev:lan`.
2. Copy the Vite Network URL.
3. Share it only with devices on the same Wi-Fi.
4. Each tester should start with `?resetAuth=1` if they used an older local session.

## Production Beta Setup

1. Create a Supabase Free project.
2. Run `supabase/migrations/0001_matchpulse_beta.sql`, `supabase/migrations/0002_matchpulse_state_snapshot.sql`, and `supabase/migrations/0003_memory_consent.sql`.
3. Enable Google and Apple providers in Supabase Auth.
4. Add the deployed app URL as an allowed redirect URL in Supabase Auth.
5. Confirm the `profile-photos` bucket exists from the migration.
6. Add env vars from `.env.example`.
7. Set `MATCHPULSE_DATA_PROVIDER=supabase` and `MATCHPULSE_STORAGE_PROVIDER=supabase`.
8. Leave `OPENAI_API_KEY` empty for zero-cost local AI insight.
9. Keep `MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1`, `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=0`, and `MATCHPULSE_ALLOW_EMAIL_VERIFICATION_PREVIEW=1` for zero-cost beta verification.
10. Configure `RESEND_API_KEY`, `MATCHPULSE_FROM_EMAIL`, and `MATCHPULSE_REQUIRE_EMAIL_DELIVERY=1` only after a verified sender domain/SMTP is available.
11. Deploy the app with the included `render.yaml` blueprint on Render Free.
12. Set `MATCHPULSE_PUBLIC_URL` to the deployed URL.
13. Run `MATCHPULSE_TEST_API=https://your-free-render-url.onrender.com npm run readiness:public-free` before inviting testers.

## Strict Zero-Cost Rules

- Do not set `OPENAI_API_KEY`; the app will use the deterministic local AI memory model.
- Use Resend Free for real public-beta account verification; keep `RESEND_API_KEY` empty only for local preview-only runs.
- Use Supabase Free for Auth, the state snapshot table, and profile photo storage.
- Use Render Free for the Node/Vite app; expect cold starts after inactivity.
- Keep beta media small because free storage and bandwidth have limits.
- Export/delete test data regularly; free tiers are not a long-term production compliance plan.

## Safety Checklist

- Users can delete memory notes.
- Users can export their private profile.
- Users can block/report a match.
- Hidden matches can be restored.
- Weekly briefing can be disabled.
- Location is fuzzed by default.
- Account deletion clears local private data.
- Beta Lab shows reports/feedback/auth emails/briefings for local review.

## Beta Success Metrics

- Profile completion rate.
- Invite acceptance rate.
- AI memory notes per user.
- Match feedback count.
- Intro/message rate.
- Date plan creation rate.
- Report/block rate.
