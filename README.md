# MatchPulse Render Deploy Artifact

Public zero-cost beta deployment artifact for MatchPulse.

This repo intentionally contains only the production build and server runtime files needed by Render Free:

- `dist/` Vite production build
- `server/api.mjs` Node API/static server
- `src/data.js` demo seed data used by the server
- `package.json` and `package-lock.json`

Do not add `.env`, secrets, local databases, uploads, or the full private source workspace here.
