# MatchPulse deployment topology

Last evidence refresh: 2026-07-13.

This document records the known topology without changing it. It contains no environment values, service identifiers, user data or database contents.

## Canonical source

- Canonical product repository: private `jonathanvanderelst1997/matchpulse`.
- Canonical branch after merging repository reconciliation: `main` at `54b48176b05ae73735e889d42a3d017bd87f41f8`.
- The local primary checkout is `$HOME/Desktop/02_Projecten/Tools/dating tool`.
- A separately recorded, uncommitted `src/App.jsx` delta remains local and must be reviewed independently.

## Current services

| Role | Render service | Workspace/region | Source | Last verified live commit | Status |
|---|---|---|---|---|---|
| Current public ingress | `matchpulse-hind-live` | My Workspace / Oregon | public `jonathanvanderelst1997/matchpulse-render-deploy`, `main` | `bb4ff05` | In use as the practical public URL; traffic source, custom-domain/external-link role, data-provider binding and rollback owner remain `TE VERIFIËREN`. |
| Secondary private-source deployment | `matchpulse` | Jonathan's workspace / Frankfurt | private `jonathanvanderelst1997/matchpulse`, `main` | verification pending | Source and auto-deploy provenance are known. The generated release marker is used to verify the post-merge deployment without changing traffic or Supabase. |

The public deploy repository contains a source copy plus built assets. It is exposure and rollback evidence, not the canonical private source.

## Secondary release verification

Production builds generate `/deployment-verification.json` with only:

- project label;
- fixed release-verification ID;
- build-time Git commit and branch from Render/GitHub metadata;
- generation timestamp.

The MatchPulse validation workflow polls only the secondary URL `https://matchpulse-hind.onrender.com/deployment-verification.json`. It does not inspect or change environment values, user data, traffic, the public ingress or Supabase. On pull requests the remote check is non-blocking because branches are not deployed. On `main` it is blocking and waits for the exact generated release marker.

## Supabase and migration evidence

- The repository contains exactly one migration file for each prefix `0001`, `0002`, `0003`, `0004` and `0005`.
- Apply them only in lexical order after confirming the target Supabase project.
- A schema-only export matched MatchPulse application structure, but the hosted migration list was empty on 2026-07-11.
- Matching schema does not prove which migrations ran, in what order, or against which deployment.
- `/api/schema-status` can verify required relations are reachable, but it does not create hosted migration history.

## Frozen decisions

Until the evidence below is complete:

- do not change repository visibility;
- do not repoint, remove, pause or manually redeploy either Render service;
- do not run or repair Supabase migrations;
- do not change Auth, Storage, email or bucket policies;
- do not treat `render.yaml` as the configuration of the current public ingress;
- do not copy future source changes into the public deploy repository.

## Evidence required before a cutover

1. Which URL, custom domain or external link receives real traffic.
2. Which Supabase project is bound to each service.
3. Ordered execution evidence for migrations `0001` through `0005`.
4. Auth, Storage, email and data-provider role for each service, without credentials.
5. A tested rollback target and named rollback owner.
6. Review and disposition of the local `src/App.jsx` delta.
7. A decision between:
   - a separated public build-artifact repository; or
   - a fully private source and deployment path.

## Rollback rule

Keep both repositories and both services unchanged until the chosen private-source route passes build, smoke, readiness, Auth/Storage verification and data-integrity checks. A later cutover requires explicit approval and must retain the former ingress only for a bounded rollback window.
