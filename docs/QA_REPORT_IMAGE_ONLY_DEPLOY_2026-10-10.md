# QA REPORT — переход sandbox deploy на image-only

## 1. META
- Repo: `AABrovarnik/ai-da-secretary-sandbox-deploy`
- Путь: `/home/aidev/.openclaw/workspace/ai-da-secretary-image-only`
- Base branch: `main` (`6055930bc620790ef5b7242e50cfcea71fb28812`)
- Task branch: `ai/deploy-image-only`
- Commit SHA: нет; изменения не закоммичены. HEAD/base `6055930bc620790ef5b7242e50cfcea71fb28812`.
- Дата/время проверки: `2026-10-10 03:12 UTC`
- Docker context: rootless builder/context доступен; runtime не запускался.
- Rootless Docker: по выбранному builder — `rootless`; контейнеры этой задачей не поднимались.
- Стек: Docker Compose, postgres + backend image + frontend image.
- Исходное ТЗ найдено: да — `TESLYA_TZ_IMAGE_ONLY_DEPLOY_2026-10-10.md` (входящее вложение).
- Host ports по конфигурации: `127.0.0.1:18080` frontend и `127.0.0.1:18081` backend.

## 2. SCOPE

Убрать `build:` для frontend/backend и использовать обязательные image names/tags из `.env.sandbox`; описать публикацию/тегирование, запуск, rollback и QA gate. Сервер, server `.env`, host Nginx, TLS, systemd, DNS/firewall не затрагивались. Commit/push/PR/merge не выполнялись.

## 3. CHANGED FILES

- `deploy/docker-compose.sandbox.yml`
- `deploy/.env.sandbox.example`
- `deploy/WEB_SANDBOX_DEPLOY.md`
- `deploy/IMAGE_ONLY_DEPLOY_PROPOSAL.md` (новый)
- `README.md`

## 4. DIFF SUMMARY

- Backend/frontend `build.context`, `dockerfile` и frontend build args удалены; вместо них Compose использует `BACKEND_IMAGE` + `BACKEND_TAG` и `FRONTEND_IMAGE` + `FRONTEND_TAG`, с обязательной интерполяцией и `pull_policy: always`.
- Example env документирует все четыре переменные; package names GHCR и SHA-tag pattern помечены как proposal, требующий подтверждения CI publisher.
- Документация описывает `config → pull → up --no-build --pull always`, app image publication prerequisite, frontend `VITE_API_BASE_URL=/api` и rollback через предыдущие tags без удаления volumes.
- Compose-файл больше не ссылается на Dockerfile или source tree приложения.

## 5. COMMAND LOG

1. `git status --short --branch`
   - Результат: task branch `ai/deploy-image-only`; изменены ровно перечисленные 5 файлов.
   - exit code: 0.
2. `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet`
   - Результат: конфигурация разобрана без ошибок; временные example-файлы `.env.sandbox` были созданы только в новом worktree для проверки и затем удалены.
   - exit code: 0.
3. `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config --format json | python3 -c '<assert backend/frontend без build, refs разрешены и используют example tags>'`
   - Результат: `PASS: no backend/frontend build keys; both image refs resolve with example tags`.
   - exit code: 0.
4. Проверка `BACKEND_IMAGE`, `BACKEND_TAG`, `FRONTEND_IMAGE`, `FRONTEND_TAG` в `deploy/.env.sandbox.example`.
   - Результат: `PASS: all image variables documented`.
   - exit code: 0.
5. `docker compose ... pull`
   - Результат: НЕ ЗАПУЩЕН — GHCR refs в env example являются незаполненными placeholders; наличие packages не подтверждено.
   - exit code: N/A (не запускался).
6. `docker compose ... up -d --no-build --pull always`
   - Результат: НЕ ЗАПУЩЕН — нет подтверждённых опубликованных images; запуск мог бы частично создать локальный stack/volumes.
   - exit code: N/A (не запускался).
7. `gh api user/packages?package_type=container --jq '.[].name'`
   - Результат: GitHub API ответил HTTP 403: токену не хватает scope `read:packages`; доступность/состав packages не удалось подтвердить.
   - exit code: 1.
8. `git diff --check`
   - Результат: whitespace errors не обнаружены.
   - exit code: 0.
9. `test ! -e .env.sandbox && test ! -e deploy/.env.sandbox`
   - Результат: временные QA env-файлы очищены.
   - exit code: 0.

## 6. CHECKS

| Проверка | Результат | Доказательство |
|---|---|---|
| Compose parse/config | PASS | `config --quiet`, exit 0 |
| Backend/frontend без local build | PASS | Разобранный Compose JSON не содержит `build` для обоих сервисов |
| Image/tag variables задокументированы | PASS | Все четыре ключа найдены в example env |
| Backend/frontend image pull | WARNING / NOT RUN | Packages/tags не подтверждены; `read:packages` отсутствует |
| Compose up/runtime smoke | WARNING / NOT RUN | Нужны опубликованные образы и отдельная изолированная runtime-приёмка |
| Regression risk (deploy artifacts only) | LOW | Конфигурация и документация; server/system files не затронуты |
| Server/system changes | PASS | Не выполнялись |

## 7. RISKS / BLOCKERS

- Предложенные `ghcr.io/aabrovarnik/ai-da-secretary-backend` и `...-frontend` — предположительные package names, не подтверждённые текущим доступом.
- Требуется app CI, который публикует оба образа по immutable commit SHA/release tags; frontend publisher должен передавать `VITE_API_BASE_URL=/api`.
- Для приватного GHCR потребуется безопасная выдача pull credentials.
- До публикации реальных image refs невозможно завершить `pull`, `up`, endpoint smoke и подтвердить runnable image-only deployment.

## 8. DECISION

**Image-only branch/config proposal: READY WITH WARNINGS.** Compose-модель валидна, build contexts убраны, image/tag-переменные и runbook подготовлены.

**Полная image-only runtime acceptance: NOT READY.** Критерии `pull + up + smoke` не подтверждены из-за отсутствия установленных package refs/images.

## 9. PR INFO

- Remote: `https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy.git`
- PR URL: нет — push не выполнялся; отдельное разрешение на push не дано.
- Merge status: NOT MERGED

## 10. Требуется ли исправление

**Исправление требуется: ДА** — до runtime acceptance подтвердить package names, опубликовать frontend/backend images с immutable tags, обеспечить pull auth и повторить `pull → up → smoke` в изолированной sandbox/test runtime.
