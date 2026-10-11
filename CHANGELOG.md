# Changelog

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