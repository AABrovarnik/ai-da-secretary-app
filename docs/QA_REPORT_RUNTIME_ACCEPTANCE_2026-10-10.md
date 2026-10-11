# Runtime Acceptance QA Report

## 1. META

- Project: `AABrovarnik/ai-da-secretary-sandbox-deploy`
- Checkout: `/home/aidev/.openclaw/workspace/ai-da-secretary-image-only`
- Date: 2026-10-10 (UTC)
- Branch / HEAD: `ai/deploy-image-only` / `6d8e315`
- Docker context: `rootless`
- Rootless Docker: PASS (Docker reports `name=rootless`)
- Compose: Docker Compose v5.5.1
- Source instruction: `TESLYA_TZ_RUNTIME_ACCEPTANCE_AFTER_GHCR_ACCESS_2026-10-10.md` (received attachment)
- Scope: sandbox runtime only; no production, system Nginx, TLS, firewall, or system service changes

## 2. SCOPE

Read-only preflight was performed on the task branch. The sandbox runtime was **not** started because no `deploy/.env.sandbox`, concrete immutable image tags, or GHCR credential were available in the checkout/Secret Store. No guessed image tags or placeholder credentials were used.

The GHCR credential request was attempted through the protected Secret Store; the tool reported that secure prompt delivery was unavailable because there was no reachable Control UI link. No credential was requested or sent in chat.

## 3. CHANGED FILES

- None in the deploy repository.
- No `deploy/.env.sandbox` was created.
- This QA report was created in the workspace root, outside the deploy checkout.

## 4. COMMAND LOG

Exit codes below are the actual shell exit codes. Commands that would mutate runtime state were deliberately not run when prerequisites were absent.

| Command / check | Exit code | Result |
|---|---:|---|
| `git status --short --branch` (deploy checkout) | 0 | `ai/deploy-image-only...origin/ai/deploy-image-only`; clean |
| `git branch --show-current` | 0 | `ai/deploy-image-only` |
| `git log -1 --oneline` | 0 | `6d8e315 feat: switch sandbox deploy to prebuilt images` |
| `git diff --check` | 0 | No whitespace errors |
| `git ls-files deploy/.env.sandbox` | 0 | No tracked sandbox env file |
| `test -e deploy/.env.sandbox` | 1 | File does not exist |
| `git check-ignore deploy/.env.sandbox` | 0 | Path is ignored by repo rules |
| `docker context show` | 0 | `rootless` |
| `docker info --format '{{json .SecurityOptions}}'` | 0 | Includes `name=rootless` |
| `docker compose version` | 0 | `v5.5.1` |
| `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet` | 1 | Blocked: env file does not exist |
| `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml pull` | NOT RUN | Blocked: no env file and no verified image tags/GHCR auth |
| `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml up -d --no-build --pull always` | NOT RUN | Blocked: same prerequisites; runtime intentionally left untouched |
| `curl -I --max-time 5 http://127.0.0.1:18080/` | 7 | Connection refused; frontend not running |
| `curl -sS --max-time 5 http://127.0.0.1:18081/health` | 7 | Connection refused; backend not running |
| `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml ps` | 1 | Blocked: env file does not exist |
| `docker compose ... logs --no-color --tail=200` | NOT RUN | No target compose stack was started; there are no target logs to inspect |
| `gh api 'user/packages?package_type=container' --jq '.[].name'` | 1 | GitHub API returned HTTP 403: authenticated credential lacks `read:packages` |
| Anonymous GHCR pull-token endpoint probes for proposed backend/frontend package names | 0 (HTTP responses: 403 / 403) | Anonymous access did not establish package/tag availability; refs remain unverified |
| `gh pr view 1 --repo AABrovarnik/ai-da-secretary-sandbox-deploy --json url,state,baseRefName,headRefName,mergeStateStatus ...` | 0 | PR #1 is OPEN, base `main`, head `ai/deploy-image-only`; merge state `CLEAN` |
| Protected Secret Store metadata listing | n/a | Store is empty |
| Protected Secret Store request for `GHCR_READ_TOKEN` | n/a | Secure prompt delivery failed: no reachable Control UI link |

Existing unrelated rootless containers were observed on ports 8102 and 8103; ports 18080 and 18081 were not bound before runtime checks. No unrelated containers were modified.

## 5. CHECKS

| Check | Status | Evidence |
|---|---|---|
| Correct branch and clean tree | PASS | `ai/deploy-image-only`, clean status, expected HEAD |
| Rootless Docker context | PASS | Context `rootless`; Docker security options include rootless |
| `.env.sandbox` with actual required variables | FAIL | File absent. Example still has placeholder SHA tags and dummy session/database secrets; `OPENAI_API_KEY` is empty |
| Exact immutable backend/frontend image refs | FAIL | `RUNTIME_PRECHECK.md` names proposed packages only; tags remain `sha-<40-hex>` placeholders; no published refs confirmed |
| GHCR package listing/pull access | FAIL | GitHub package API HTTP 403 for missing `read:packages`; Secret Store empty and secure token request could not be delivered |
| `docker compose config --quiet` | FAIL | Exit 1 due absent env file |
| `docker compose pull` | BLOCKED / NOT RUN | No actual image refs or registry auth |
| `docker compose up --no-build --pull always` | BLOCKED / NOT RUN | No verified inputs; no runtime side effects performed |
| Frontend `HEAD /` | FAIL | Exit 7, connection refused on `127.0.0.1:18080` |
| Backend `GET /health` | FAIL | Exit 7, connection refused on `127.0.0.1:18081` |
| Authentication/meeting API readiness | BLOCKED / NOT RUN | No backend runtime available |
| `.ogg` processing workflow | BLOCKED / NOT RUN | No backend/image runtime; `OPENAI_API_KEY` absent in example and no credential available for actual processing |
| Compose `ps` / target logs | BLOCKED | `ps` exit 1 due absent env file; logs not run because no target stack exists |
| Server/system changes excluded | PASS within performed scope | No system Nginx/TLS/production changes or commands were made |

## 6. SMOKE RESULT (.ogg workflow)

**NOT RUN.** No register/login, meeting creation, `.ogg` upload, `process-latest-audio`, or `ProcessingRun` status was produced. There is no runtime result or processing failure reason to report; the workflow is blocked before application startup by missing verified image tags, GHCR credentials, and sandbox configuration. No status is inferred.

## 7. RISKS / BLOCKERS

1. Supply the actual immutable backend and frontend image refs/tags (or digests) published to GHCR. The current deploy documentation labels package names as proposed and contains no real tag values.
2. Provide GHCR pull auth through a secure route. The protected Secret Store is empty; its request prompt could not be delivered because no reachable Control UI link was configured. Do not send the token in chat.
3. Provide/authorize a valid application `OPENAI_API_KEY` through a secure mechanism if `.ogg` processing is expected to finish against the live transcription/model APIs. The provided `.env.sandbox.example` has this field empty.
4. After those prerequisites are available, create the ignored local `deploy/.env.sandbox`, validate it, then run pull → up → endpoints → API and `.ogg` smoke → ps/log review with secrets redacted.

## 8. DECISION

# NOT READY — runtime acceptance

Acceptance criteria are not met: images were not pulled, the stack was not started, frontend/backend endpoints are unavailable, and the `.ogg` workflow was not executed. Runtime was intentionally left unchanged rather than launched with placeholder refs or dummy secrets.

## 9. PR INFO

- URL: https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy/pull/1
- State: OPEN (not merged)
- Base/head: `main` ← `ai/deploy-image-only`
- PR remains unchanged; this runtime pass made no deploy-repository changes.
