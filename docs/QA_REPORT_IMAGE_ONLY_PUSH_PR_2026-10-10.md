# QA REPORT — image-only push, PR и runtime precheck

## 1. META

- Repo: `AABrovarnik/ai-da-secretary-sandbox-deploy`
- Base branch: `main` (`6055930bc620790ef5b7242e50cfcea71fb28812`)
- Task branch: `ai/deploy-image-only`
- Commit: `6d8e315` — `feat: switch sandbox deploy to prebuilt images`
- Проверка: `2026-10-10 03:30 UTC`
- PR: https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy/pull/1
- PR state: OPEN, base `main`, head `ai/deploy-image-only`, mergeable; merge не выполнялся.

## 2. SCOPE

Добавлен runtime precheck для определения image refs/tags, GHCR auth, manifest checks и последовательности `compose config → pull → up --no-build → smoke`. Изменения запушены и открыта PR без merge. Серверный деплой, server `.env`, системные Nginx/TLS, systemd, DNS/firewall не выполнялись и не менялись.

## 3. CHANGED FILES

1. `README.md`
2. `deploy/.env.sandbox.example`
3. `deploy/IMAGE_ONLY_DEPLOY_PROPOSAL.md`
4. `deploy/RUNTIME_PRECHECK.md`
5. `deploy/WEB_SANDBOX_DEPLOY.md`
6. `deploy/docker-compose.sandbox.yml`

## 4. DIFF SUMMARY

- Compose использует только `BACKEND_IMAGE` + `BACKEND_TAG` и `FRONTEND_IMAGE` + `FRONTEND_TAG`; локальные build contexts удалены.
- Новый `deploy/RUNTIME_PRECHECK.md` фиксирует proposed package names:
  - `ghcr.io/aabrovarnik/ai-da-secretary-backend`
  - `ghcr.io/aabrovarnik/ai-da-secretary-frontend`
- Рекомендуемый tag: `sha-<40-hex-app-source-commit>`; это формат, не подтверждение наличия конкретных опубликованных tags.
- Precheck описывает registry manifest lookup, минимально необходимый pull access, `config`, `pull`, isolated `up --no-build`, endpoint smoke и критерии PASS/FAIL.
- PR body содержит прямую ссылку на [deploy/RUNTIME_PRECHECK.md](https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy/blob/ai/deploy-image-only/deploy/RUNTIME_PRECHECK.md).

## 5. COMMAND LOG

- `git status --short --branch; git branch --show-current; git remote -v; git log -1 --oneline; gh pr list --state all --head ai/deploy-image-only --json ...` — exit 0; корректный repo/branch, PR ранее отсутствовал.
- `git ls-remote --heads origin ai/deploy-image-only` (до push) — exit 0; удалённая ветка ещё отсутствовала.
- `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet` — exit 0 с временными копиями example env в новом worktree; они удалены после проверки.
- `docker compose ... config --format json | python3 -c '<assert image refs and absence of backend/frontend build>'` — exit 0; обе image refs разрешены, build keys нет.
- Проверка наличия `BACKEND_IMAGE`, `BACKEND_TAG`, `FRONTEND_IMAGE`, `FRONTEND_TAG` в example env — exit 0.
- Проверка содержания `deploy/RUNTIME_PRECHECK.md` по обязательным темам — exit 0.
- Первый `git diff --cached --check` — exit 2; найдены два trailing-space в proposal.
- Удаление trailing-space, повторный `git diff --cached --check` — exit 0.
- `git commit -m "feat: switch sandbox deploy to prebuilt images"` (первая попытка) — exit 128 из-за отсутствующей Git author identity.
- Repo-local author identity настроена по существующей identity исходного commit; повторный `git commit -m "feat: switch sandbox deploy to prebuilt images"` — exit 0, создан `6d8e315`.
- `git diff --check origin/main...HEAD` — exit 0.
- `rg`-проверка шаблонов GitHub tokens/private keys — exit 0, совпадений нет.
- `gh api user/packages?package_type=container --jq '.[].name'` — exit 1; GitHub ответил HTTP 403, токену не хватает `read:packages`.
- `curl ... https://api.github.com/users/AABrovarnik/packages?package_type=container` — process exit 0, HTTP 401 `Requires authentication`.
- `git push -u origin ai/deploy-image-only` — exit 0; ветка опубликована.
- `gh pr create --repo AABrovarnik/ai-da-secretary-sandbox-deploy --base main --head ai/deploy-image-only ...` — exit 0; создан PR #1.
- `gh pr view 1 ... --json url,state,baseRefName,headRefName,body,mergeable,statusCheckRollup` — exit 0; PR OPEN, base/main и head/task branch правильные, precheck link присутствует, mergeable.
- `git fetch origin && git diff --check origin/main...origin/ai/deploy-image-only && git diff --stat ... && git status --short --branch` — exit 0; удалённый diff чистый, worktree чистый и tracking удалённой task branch.
- `gh pr checks 1 --repo AABrovarnik/ai-da-secretary-sandbox-deploy` — exit 1; GitHub сообщил `no checks reported` (для ветки не опубликованы check runs).
- Image `imagetools inspect`, `docker compose pull`, `docker compose up` и smoke — не запускались: реальный SHA tag отсутствует/не подтверждён, а package listing недоступен с текущими правами.

## 6. CHECKS

| Проверка | Статус | Факт |
|---|---|---|
| Task branch push | PASS | `origin/ai/deploy-image-only` создан |
| PR в `main` без merge | PASS | PR #1 OPEN; MERGEABLE; не смержен |
| PR body содержит ссылку на runtime precheck | PASS | ссылка на `deploy/RUNTIME_PRECHECK.md` проверена через `gh pr view` |
| Compose config и отсутствие build | PASS | config exit 0; model assertions exit 0 |
| Runtime precheck документ покрывает требования | PASS | image names, SHA tags, registry/auth, commands, PASS/FAIL gate |
| Registry packages/tags доступны | WARNING / NOT VERIFIED | API 403/401; конкретные tags пока placeholders |
| CI checks | WARNING | GitHub не сообщил check runs (`gh pr checks` exit 1) |
| Server/system changes | PASS | не выполнялись |

## 7. RISKS / BLOCKERS

- Предложенные GHCR package names и конкретные SHA tags требуют подтверждения и публикации со стороны app CI.
- Текущая GitHub auth не имеет `read:packages`; pull private images не доказан.
- На PR не отображаются CI checks; их отсутствие не равнозначно успешному CI.
- Runtime acceptance остаётся отдельным следующим этапом после устранения image/auth blockers.

## 8. DECISION

**READY WITH WARNINGS для push + PR + runtime precheck.** Все deliverables текущего этапа опубликованы; server/system actions не выполнялись.

**Runtime image acceptance остаётся NOT READY** до проверки реальных manifests, успешных `pull`, изолированного `up` и smoke.

## 9. PR INFO

- URL: https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy/pull/1
- Base/head: `main` ← `ai/deploy-image-only`
- State: OPEN; merge status: NOT MERGED
- Mergeability: MERGEABLE
- CI: checks не предоставлены GitHub для этой ветки.
