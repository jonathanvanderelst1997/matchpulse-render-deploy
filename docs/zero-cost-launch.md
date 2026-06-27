# MatchPulse Zero-Cost Launch

This path keeps the beta at 0 EUR/month while still allowing real testers.

## Free Architecture

- Frontend and API: Render Free web service using `render.yaml`.
- Auth: free beta login by default; Supabase Free Auth with Google/Apple providers when explicitly enabled.
- Database: Supabase Free via the `matchpulse_app_state` snapshot table.
- Photo storage: Supabase Free Storage bucket `profile-photos`.
- AI: built-in local heuristic, no OpenAI key.
- Email: Resend Free for real account verification/reset emails, or local previews for private LAN/local testing.

## Environment

Use `.env.free.example` as the template for Render env vars.

Required for public free beta:

```bash
MATCHPULSE_PUBLIC_URL=https://your-free-render-url.onrender.com
MATCHPULSE_DATA_PROVIDER=supabase
MATCHPULSE_STORAGE_PROVIDER=supabase
MATCHPULSE_STATE_ID=beta
MATCHPULSE_STORAGE_BUCKET=profile-photos
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_MATCHPULSE_OAUTH_PROVIDERS=
RESEND_API_KEY=...
MATCHPULSE_FROM_EMAIL=MatchPulse <briefing@yourdomain.com>
MATCHPULSE_REQUIRE_EMAIL_VERIFICATION=1
MATCHPULSE_REQUIRE_EMAIL_DELIVERY=1
```

Keep these empty for strict zero-cost mode:

```bash
OPENAI_API_KEY=
```

## Setup Order

1. Create the Supabase Free project.
2. Run migrations `0001`, `0002`, and `0003`.
3. Add Auth redirect URLs for the Render URL.
4. Add a verified sender/domain in Resend and set `RESEND_API_KEY` plus `MATCHPULSE_FROM_EMAIL`.
5. Leave `VITE_MATCHPULSE_OAUTH_PROVIDERS` empty until a provider is enabled in Supabase Auth. After Google works in Supabase, set it to `google`.
6. Deploy with Render Free using `render.yaml`.
7. Add the required env vars in Render.
8. Run `MATCHPULSE_TEST_API=https://your-free-render-url.onrender.com npm run readiness:public-free`.
9. Create one account, verify it with the Supabase Auth email, complete onboarding, copy the invite link, and open it in a private browser to create another tester.

## Limits To Respect

- Render Free can sleep after inactivity, so first load can be slow.
- Supabase Free has storage/database/auth limits; keep early beta small.
- Local AI is deterministic and cheap, but not as nuanced as paid model calls.
- Supabase Auth email is enough for very low-volume early beta verification. Resend stays the later upgrade after a sender domain is verified.

## Upgrade Later

Only add paid services after the product proves people want it:

- OpenAI API for richer memory analysis.
- Resend or another email provider for real weekly email delivery.
- Paid hosting/database once free cold starts or limits hurt testing.
