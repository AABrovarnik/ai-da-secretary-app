# Changelog

## 2026-10-11
- Fixed reviewed assignment deadlines: `dueTime` and `timeZone` now persist in `Assignment`, and confirmed results prefer the reviewed normalized deadline over stale AI `dueDateRaw` text.
- Added the Stage 1 review workflow:
  - editable AI candidate screen with per-item approve/reject actions;
  - transactional creation of approved decisions and assignments;
  - evidence ownership validation, review history and duplicate-review protection;
  - confirmed-results view and reviewed-candidate archive.
- Stabilized the backend container runtime on the sandbox host:
  - switched backend build/runtime images to `node:20-bookworm-slim`;
  - installed OpenSSL CA/runtime packages for Prisma;
  - added Prisma `debian-openssl-3.0.x` binary target;
  - corrected the compiled backend entrypoint to `dist/src/index.js`;
  - changed `bcryptjs` consumption to an ESM-compatible default import.
- Re-ran typecheck, lint, tests and production build successfully.
- Confirmed the sandbox frontend and backend health after host restart.
- Activated a dedicated HTTPS Nginx route for `sandbox.вишня01.рф` without changing the academy application route.

## 2026-10-09
- Added manual model selection strategy: default `OPENAI_MODEL` with optional per-run `modelOverride` for text/audio processing.
- Added sandbox deployment pack for web testing:
  - `docker/backend.Dockerfile` and `docker/frontend.Dockerfile`
  - `deploy/docker-compose.sandbox.yml` + `deploy/.env.sandbox.example`
  - `deploy/frontend.nginx.conf` and deployment runbook `deploy/WEB_SANDBOX_DEPLOY.md`
  - frontend API base url now configurable via `VITE_API_BASE_URL` for sandbox reverse-proxy
- Stage 1.3 foundation added:
  - backend audio upload endpoint `POST /api/meetings/:meetingId/materials/audio`
  - backend audio processing endpoint `POST /api/meetings/:meetingId/process-latest-audio`
  - OpenAI ASR adapter with persisted transcription into `Material.contentText`
  - frontend controls for audio upload and audio processing
  - smoke test contour script `scripts/smoke-audio.ps1` and guide `docs/TEST_CONTOUR.md`
- Continued staged implementation (`docs/IMPLEMENTATION_STAGES.md`).

## 2026-10-08
- Imported stage-1 source docs into repository root: `SPEC.md`, `CODEX_TASKS_STAGE1.md`.
- Added stage 1.1 project skeleton for AI-да-Секретарь:
  - npm workspaces with `apps/frontend`, `apps/backend`, `apps/worker`
  - root scripts for build/typecheck/lint/test and prisma actions
  - backend/worker health architecture with liveness + readiness checks
  - prisma schema and initial SQL migration for stage-1 entities
  - baseline backend test with Vitest + Supertest
  - docs baseline (`README.md`, `docs/PROJECT_STATE.md`, `docs/AI_CONTRACT.md`)
  - security/runtime defaults (`.env.example`, `.gitignore`, `AGENTS.md`)
