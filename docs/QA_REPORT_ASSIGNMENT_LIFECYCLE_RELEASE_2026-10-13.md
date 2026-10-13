# QA REPORT — Assignment Lifecycle Release

## 1. Общая информация

- Проект: AI-da-Secretary public WEB sandbox
- Дата проверки: 2026-10-13 UTC
- Плановый риск: **L3**, risk score **9/10** (ширина 2, неопределённость 1, impact 2, reversibility 2, system access 2)
- QA level: **L3**; выполнен обязательный независимый статический review
- Application repository: `AABrovarnik/ai-da-secretary-app`
- Application branch: `codex/stage1-review-screen`
- Source SHA: `292c1e8fb72d110745cf8523db4fb28ffb27a2be`
- PR: [#3 — open, not merged](https://github.com/AABrovarnik/ai-da-secretary-app/pull/3)
- Deployment repository/branch: `AABrovarnik/ai-da-secretary-sandbox-deploy`, `ai/deploy-image-only`
- Deployment checkout HEAD at pre-check: `6d8e315729d925fdc65ba1e6c867efd67270d3d0`
- Sandbox: `https://sandbox.xn--01-dlcyz9d7b.xn--p1ai/`
- Academy: `https://academy.xn--01-dlcyz9d7b.xn--p1ai/`
- OS user: `aidev`; `id -nG` in normal shell: `aidev users`; `sg docker` shell: group `docker` active
- Global Docker context remained `rootless`; all target daemon operations explicitly used `docker --context default` inside `sg docker`
- Target daemon: Docker 29.8.1, host `ams-1-vm-9ggk`, root `/var/lib/docker`
- Compose project: `deploy`; services: `backend`, `frontend`, `postgres`
- PLAN FACT: requested public sandbox deployment with persistent PostgreSQL, GHCR publication and forward-only production-data migration

## 2. Итог проверки

| № | Проверка | Ожидалось | Фактический результат | Статус |
|---|---|---|---|---|
| 1 | L3 group-shell / target Docker | `default` daemon доступен без смены global context | `sg docker` активирует группу; `docker --context default info` и `ps` успешны | PASS |
| 2 | Application checkout / PR | Нужная ветка, точный SHA, PR открыт | Branch `codex/stage1-review-screen`, SHA совпадает, PR #3 OPEN, `mergedAt=null` | PASS |
| 3 | Deployment checkout | Нужная ветка, чистое tracked состояние | Branch `ai/deploy-image-only`, tracked status clean; `.env.sandbox` mode 600 | PASS |
| 4 | Source QA | Все заданные команды успешны | generate/typecheck/lint/test/build/diff-check exit 0; 18 тестов passed | PASS |
| 5 | PostgreSQL + env backup | Dump и env backup mode 600 в `web-sandbox/backups` | Каталог отсутствует; `aidev` не может создать его в root-owned parent; `sudo -n` отказал. Ни одного backup-файла нет | FAIL — **P0** |
| 6 | Images/migration/deploy/API | Новый immutable runtime и все acceptance проверки | Не выполнялись, остановка до любых изменений из-за отсутствия обязательного backup | NOT RUN |
| 7 | Academy isolation | HTTP status до/после одинаков | HTTPS HEAD 200 до и после; конфиги/контейнеры/route не менялись | PASS |

## 3. Source QA / command log

| Команда | Exit code | Результат |
|---|---:|---|
| `sg docker -c 'id && docker --context default info && docker --context default ps'` | 0 | Target rootful daemon доступен; три целевых контейнера видны |
| `gh pr view 3 --repo AABrovarnik/ai-da-secretary-app ...` | 0 | PR #3 OPEN, not merged, head SHA требуемый |
| `git fetch --all --prune` + `git pull --ff-only` (application checkout) | 0 | Fast-forward `71f218d` → требуемый SHA |
| `npm ci` | 0 | Установлено 370 packages; audit сообщил 6 advisories (3 moderate, 1 high, 2 critical) |
| `npm run db:generate` | 0 | Prisma Client 5.22.0 сгенерирован |
| `npm run typecheck` | 0 | Все workspaces прошли |
| `npm run lint` | 0 | Все workspaces прошли |
| `npm test` | 0 | Frontend 7 + backend 11 = 18 passed; worker: no test files, exit 0 |
| `npm run build` | 0 | Frontend, backend, worker builds прошли |
| `git diff --check` | 0 | Passed; application checkout после QA clean (tracked) |
| `docker compose ... config` из deployment checkout | 0 | Старые refs и loopback bindings валидны; build sections отсутствуют |
| `python backup preflight` | 1 | PermissionError при создании `/srv/ai-shared/web-sandbox/backups`; dump/env backup не создавались |
| `sudo -n true` | 1 | Отказ sudo: пользователь `aidev` не имеет разрешённого non-interactive elevation |

`npm ci` сообщил о deprecated dependencies и advisories; зависимости и lockfile не исправлялись в рамках этой задачи.

## 4. Baseline runtime и infrastructure

### До любых runtime изменений

- Backend container: `246f545651abdc942b261a643dd080b9622e3d70b87b2c64da305236a703fd87`
- Frontend container: `ec356af93227ce0ff4f9535d5e19b0c09197dc15d9b150d278309861c63fcee0`
- PostgreSQL container: `d9fc134d6ddf70aa083b94e09dd23aeb2de365f7f4b46019f2f478ab7e6331ca`
- PostgreSQL volume: `deploy_sandbox-postgres-data` → `/var/lib/postgresql/data`
- Old backend image/tag (rollback reference): `ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-71f218dea7ec`
- Old frontend image/tag (rollback reference): `ghcr.io/aabrovarnik/ai-da-secretary-frontend:sha-3861a8b91b7f`
- Current env tags before/after: backend `sha-71f218dea7ec`, frontend `sha-3861a8b91b7f`
- Existing bindings: backend `127.0.0.1:18081->4000/tcp`; frontend `127.0.0.1:18080->80/tcp`
- Compose resolved refs: old tags above; build sections absent

### Baseline/post-stop HTTP checks

| Request | Expected | Actual | Exit | Result |
|---|---|---:|---:|---|
| `GET http://127.0.0.1:18081/health` | 200, process/database ok | 200; JSON `status=ok`, both checks `ok=true` | 0 | PASS, baseline only |
| `HEAD http://127.0.0.1:18080/` | 200 | 200 | 0 | PASS, baseline only |
| `HEAD https://sandbox.xn--01-dlcyz9d7b.xn--p1ai/` without `-k` | 200 | 200 | 0 | PASS, baseline only |
| `HEAD https://academy.xn--01-dlcyz9d7b.xn--p1ai/` without `-k`, before/after | unchanged | 200 / 200 | 0 / 0 | PASS |
| TLS sandbox chain verification | Chain valid, SAN contains host | OpenSSL verify return code 0; SAN includes sandbox hostname | 0 | PASS, baseline only |

Post-stop check confirms the original PostgreSQL container ID and volume are unchanged. Existing backend/frontend tags, containers, health, and bindings remain as before. No migration, image pull/push, recreate, or data modification occurred.

## 5. Backup, images, migration, API acceptance

- Required PostgreSQL dump: **not created**; required backup directory could not be created without root-owned-parent write access.
- Required `.env.sandbox` backup: **not created**.
- Target image refs (not built/pushed):
  - `ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-292c1e8fb72d`
  - `ghcr.io/aabrovarnik/ai-da-secretary-frontend:sha-292c1e8fb72d`
- Target digests: unavailable; images not built/pushed.
- Migration `202610130003_assignment_history`: not applied.
- Backend restart/migration logs: not applicable; no containers recreated.
- Assignment API lifecycle/ownership/restart-persistence acceptance: not run; no synthetic accounts or records created.
- API acceptance IDs/statuses: none.

## 6. Независимый L3 review

Independent read-only review of exact source SHA found no release-blocking issue by static inspection.

- **PASS:** migration/model alignment; authenticated assignment route; owner-scoped lookup; transactional update/history; no history row on a no-op update.
- **WARNING:** date/time schema validation is shape-only; impossible values such as `2026-02-31` or `29:99` may pass parsing. Required runtime invalid-date acceptance remains unverified.
- **WARNING:** concurrent assignment edits have no version precondition; history snapshots can become stale under simultaneous requests.
- Review did not access runtime credentials or apply migrations/API calls.

## 7. UI boundary

- Browser tool status: enabled but not running (`running=false`, no CDP/browser executable detected).
- Required release was not deployed, so desktop/360 px UI acceptance against the target runtime was not possible.
- `UI_ACCEPTANCE=PENDING_CODEX`.

## 8. Безопасность и границы изменений

- No secrets or full `.env.sandbox` values were printed or copied into this report.
- No `.env.sandbox` values were changed.
- No PostgreSQL data/volume was deleted, reset, or modified.
- No Academy config/container/route was changed.
- No Nginx, TLS, firewall, systemd, SSH, or system files were changed.
- No rootless daemon containers/networks/volumes were created.
- No release tag/latest was changed; no email was sent; PR was not merged.

## 9. Проблема, следующий шаг и готовность

### Единственный ближайший P0

`/srv/ai-shared/web-sandbox` is `root:root` mode `755`; the requested `backups` child does not exist and `aidev` cannot create it. Non-interactive `sudo` is denied. Because PostgreSQL backup is a mandatory pre-deployment gate, work stopped before DB dump, image publication, migration, or runtime changes.

### Минимальное следующее действие

An administrator must create `/srv/ai-shared/web-sandbox/backups` owned by `aidev:aidev` with mode `700`, or the user must explicitly supply an approved alternate backup location. Then repeat backup validation before resuming the remaining authorized steps.

- `DEPLOY_READY=NO`
- `API_ACCEPTANCE_READY=NO`
- `UI_ACCEPTANCE=PENDING_CODEX`
- Общий статус: **NOT READY**
- Исправление/действие требуется: **ДА** — обеспечить owner-only backup directory, затем продолжить задачу
- Merge выполнен: **NO**
