# QA REPORT — Assignment Lifecycle Release (Final)

## 1. Общая информация

- Проект: AI-da-Secretary public WEB sandbox.
- Дата: 2026-10-13 UTC.
- Риск: **L3**, score **9/10**; затронуты публикация образов, production-like PostgreSQL migration и runtime.
- QA level: **L3**, независимый статический review выполнен.
- Application repository: AABrovarnik/ai-da-secretary-app.
- Application source SHA для обоих образов: 292c1e8fb72d110745cf8523db4fb28ffb27a2be.
- Source checkout для сборки: чистый detached worktree; обычный checkout не переключался и не reset-ился.
- Application PR: [#3 — OPEN, не merged](https://github.com/AABrovarnik/ai-da-secretary-app/pull/3).
- Deployment repository: AABrovarnik/ai-da-secretary-sandbox-deploy, branch ai/deploy-image-only.
- Sandbox: https://sandbox.xn--01-dlcyz9d7b.xn--p1ai/.
- Academy control: https://academy.xn--01-dlcyz9d7b.xn--p1ai/.
- Target daemon: Docker 29.8.1, rootful default, host ams-1-vm-9ggk, Docker root /var/lib/docker; команды выполнялись через sg docker.
- Compose project: deploy; сервисы: backend, frontend, postgres.

## 2. Итог

Runtime обновлён на образы, собранные из точного application SHA 292c1e8…. Forward-only миграция прошла, PostgreSQL и persistent volumes сохранены, API lifecycle/history и persistence после backend restart проверены.

**Release acceptance остаётся NOT READY по двум причинам:**

1. API принял невозможные dueDate=2026-02-31 и dueTime=29:99; дата нормализовалась в 2026-03-03, время сохранилось как 29:99. Это подтверждённая ошибка backend validation.
2. Интерактивная визуальная проверка UI на desktop/360 px не завершена: OpenClaw browser включён, но browser executable/CDP недоступен. Новые frontend assets подтверждены через HTTPS, однако это не заменяет визуальный прогон.

- DEPLOY_READY=YES
- API_ACCEPTANCE_READY=NO
- UI_ACCEPTANCE=PARTIAL; VISUAL_BROWSER_CHECK=PENDING
- OVERALL=NOT READY
- Исправление требуется: **ДА** — календарная дата и время должны валидироваться семантически; добавить regression tests, затем выпустить следующий immutable image. В этом проходе исходники не исправлялись.
- Merge выполнен: NO

## 3. Provenance и публикация образов

| Сервис | Immutable tag | Registry digest | OCI revision |
|---|---|---|---|
| backend | ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-292c1e8fb72d | sha256:027c66a98a41b9c421224d3ee61609eb53c1e21ad1e2382580ca6b88a081ce55 | 292c1e8fb72d110745cf8523db4fb28ffb27a2be |
| frontend | ghcr.io/aabrovarnik/ai-da-secretary-frontend:sha-292c1e8fb72d | sha256:8b982232d754855b6c22de3d1aa072c91edeb81080587f5f15235555be7849dd | 292c1e8fb72d110745cf8523db4fb28ffb27a2be |

Evidence:

- Clean detached source worktree HEAD exactly matched 292c1e8fb72d110745cf8523db4fb28ffb27a2be; worktree remained clean.
- Backend and frontend buildx build --push завершились с exit 0.
- У каждого образа OCI org.opencontainers.image.revision равен полному SHA.
- Registry manifest inspection и pull завершились успешно; оба image — linux/amd64.
- GHCR package versions для обоих tags созданы 2026-10-13 во время этой сборки; это не ранее существовавшие tags.
- Frontend собран с VITE_API_BASE_URL=/api.
- Build сообщил о 6 npm advisories (3 moderate, 1 high, 2 critical) и deprecated dependencies; lockfile/dependencies не менялись.

## 4. Backup и конфигурация

До миграции/deploy созданы и проверены:

- Каталог /srv/ai-shared/web-sandbox/backups: owner aidev:aidev, mode 700.
- Env backup: assignment-lifecycle-20261013T131903Z.env, mode 600, 905 bytes.
- PostgreSQL custom logical dump: assignment-lifecycle-20261013T131903Z.postgres.dump, mode 600, 37,286 bytes; pg_restore --list exit 0.
- SHA-256 dump: 7533e47a546fe08a74dcde957a76dc60aab19ea7fba3864220b467e876d871c3.
- Секретные значения env не выводились и в отчёт не включены.

В активном /srv/ai-shared/web-sandbox/ai-da-secretary/deploy/.env.sandbox изменены только BACKEND_TAG и FRONTEND_TAG на sha-292c1e8fb72d; mode остался 600. Исходная копия env совпала с pre-deploy backup до редактирования.

- docker compose config --quiet — exit 0.
- Resolved images — только новые backend/frontend refs.
- В deploy Compose для backend/frontend нет build-context; persistent volumes и loopback port bindings сохранены.
- Tracked deployment checkout не изменён; исходный source branch и его история не reset-ились.

## 5. Миграция и runtime

- Target daemon непосредственно перед изменением подтверждён: default, /var/lib/docker; исходные container IDs совпадали с pre-deploy baseline.
- PostgreSQL container d9fc134d6ddf70aa083b94e09dd23aeb2de365f7f4b46019f2f478ab7e6331ca остался тем же и healthy.
- Применена миграция 202610130003_assignment_history: создаёт таблицу AssignmentHistory, FK с ON DELETE CASCADE и индекс; не выполняет reset/drop.
- Backend migration command сообщила All migrations have been successfully applied; после restart — No pending migrations to apply.
- Пересозданы только backend и frontend, с --no-deps; PostgreSQL не пересоздавался.
- Текущий backend container ID: a47dd1f262531a80254b229d450e4114d8d6e4254d3750295e0f7a77df3f3c7f; image ID соответствует backend registry digest.
- Текущий frontend container ID: 50aebc12e82207ad8beaf2b2c31cab31ba887b5b8af1e3fc3348c0585cd12614; image ID соответствует frontend registry digest.
- Persistent volumes остались: deploy_sandbox-postgres-data, deploy_sandbox-audio-data; удаление/пересоздание volumes не выполнялось.
- Bindings подтверждены: backend 127.0.0.1:18081->4000, frontend 127.0.0.1:18080->80.
- Backend health: HTTP 200; status=ok, DB check ok=true.
- Sandbox HTTPS: HTTP 200 с проверяемым TLS.
- Academy HTTPS: HTTP 200 до и после; Academy/Nginx/TLS конфигурация не менялась.
- Новый frontend asset подтверждён по HTTPS: assets/index-BOrTmLwt.js (160,305 bytes), содержит lifecycle/history UI labels.
- Временный migration-run container удалён (--rm); post-deploy осталось 0 таких контейнеров.

## 6. Runtime API acceptance

Все записи создавались как синтетические fixtures с example.invalid; после проверок тестовые meetings/users удалены. Подтверждено, что synthetic accounts отсутствуют.

| Probe | Фактический результат | Статус |
|---|---|---|
| Регистрация и login двух synthetic owners | HTTP 201 / 200 | PASS |
| Meetings API без токена | HTTP 401 | PASS |
| Чужой owner читает meeting/patches assignment | HTTP 404 | PASS |
| PATCH без токена | HTTP 401 | PASS |
| Неверный status / неверное тело | HTTP 400 | PASS |
| Assignment ID под другим meeting ID | HTTP 404 | PASS |
| Candidate review с evidence чужой встречи | HTTP 400 | PASS |
| Одобрение candidate | HTTP 200; создано 1 assignment и candidate history | PASS |
| Повторное candidate review | HTTP 409 | PASS |
| Owner меняет поручение и статус | HTTP 200; одна AssignmentHistory с changed fields | PASS |
| Повтор того же PATCH | HTTP 200; дополнительная history row не создаётся | PASS |
| Очистка nullable assignee/deadline полей | HTTP 200; поля стали null | PASS |
| GET meeting возвращает историю | HTTP 200 | PASS |
| Assignment и history после backend restart | HTTP 200; значения и history сохранились | PASS |
| Невозможная дата 2026-02-31, время 29:99 | HTTP 200; дата сохранена как 2026-03-03, время как 29:99 | FAIL |
| Очистка synthetic fixtures | 2 meetings + 2 users удалены; последующий fixture удалён; matching test accounts = 0 | PASS |

Проверки не запускали внешний AI/ASR, не отправляли email от synthetic users и не создавали реальных пользовательских записей.

**Независимый review** точного source SHA не выявил release-blocking проблем по migration/model alignment, auth/ownership и transactional history. Он предупреждал о shape-only validation для даты/времени и отсутствии optimistic concurrency. API probe подтвердил первую проблему. Конкурентные PATCH requests не проверялись; version precondition отсутствует.

## 7. UI acceptance boundary

- Browser status: enabled=true, running=false, detectedExecutablePath=null, CDP недоступен.
- HTTPS root и JS/CSS assets нового frontend проверены; это доказывает выдачу собранного UI, но не визуальную/интерактивную корректность.
- Desktop walkthrough, мобильная ширина 360 px, форма редактирования/история и сохранение через UI не проверены.
- Поэтому VISUAL_BROWSER_CHECK=PENDING, без утверждения о полном UI acceptance.

## 8. Проверки исходников и границы изменений

Из предшествующего source QA на том же application SHA:

- npm run db:generate, npm run typecheck, npm run lint, npm test, npm run build, git diff --check — exit 0.
- Тесты: 18 passed (frontend 7, backend 11); worker не содержит test files, exit 0.
- Production backend/frontend image builds также завершились успешно.
- Затронутые продуктовые исходники не исправлялись в этом runtime проходе.
- Nginx/TLS, Academy, firewall, systemd, SSH, PostgreSQL container/volume и app source branch не изменялись.
- Application PR #3 остаётся OPEN; merge не выполнялся.

## 9. Следующий шаг

Исправить backend semantic validation:

- отвергать даты, не существующие в календаре (включая 2026-02-31);
- проверять диапазон времени (например, 00:00–23:59);
- добавить regression/API tests;
- повторить QA и независимый review;
- выпустить новый immutable image из нового конкретного application commit и выполнить acceptance повторно.

До отдельного разрешения на исправления текущий runtime оставлен на точном запрошенном SHA 292c1e8…; автоматический rollback не выполнялся.

## 10. Follow-up — backend semantic deadline hotfix (2026-10-13)

This section records the authorized follow-up and does not rewrite the original release FAIL in sections 2, 6, and 9. The earlier result remains as historical evidence; current backend-hotfix readiness is reported separately below.

### Scope and provenance

- Follow-up request: `TESLYA_TASK_DEADLINE_VALIDATION_FIX_2026-10-13.md`.
- Application repository/branch: `AABrovarnik/ai-da-secretary-app`, `codex/stage1-review-screen`.
- Exact application source SHA: `0d77ad06e2c6e772a6d9cc950acf0fe4ba8a40d3` (`fix: validate assignment deadlines semantically`).
- Build source: clean detached worktree at that SHA; ordinary branch checkout was not used for the image build.
- PR #3 remained OPEN during validation; merge was not performed.
- Backend image: `ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-0d77ad06e2c6`.
- GHCR OCI index digest: `sha256:7b560f006c4af525b12d29e432b9ea77fb7a334e648af09c34d61a8c65b14fb8`.
- `linux/amd64` platform manifest: `sha256:17893fa1a67f742ec78eac868ab428a235af0882e75814b79fdf6ec5ecccdbec`.
- Pulled image OCI `org.opencontainers.image.revision` exactly matched the full required source SHA.
- Rollback tag retained: `sha-292c1e8fb72d`.

### Source QA

Commands were run in the exact-SHA detached worktree:

| Command | Exit/result |
|---|---|
| `npm ci` | 0; dependency audit reported 6 advisories (3 moderate, 1 high, 2 critical); no dependency changes were made |
| `npm run db:generate` | 0 |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm test` | 0; 20 passed (frontend 7, backend 13); worker reported no test files and exited 0 |
| `npm run build` | 0 |
| `git diff --check` | 0 |

An independent read-only L3 source review returned PASS: impossible calendar dates and out-of-range times are rejected by both assignment-update and candidate-review schemas before database mutation; ownership filtering remains intact. Low-priority edge warning: JavaScript `Date.UTC` treats years `0000`–`0099` specially, so these early years are rejected. This does not affect the required probes or ordinary modern deadlines and is not release-blocking for this hotfix.

### Image build and backend-only deployment

- `sg docker -c 'docker --context default buildx build --platform linux/amd64 --file docker/backend.Dockerfile --label org.opencontainers.image.revision=0d77ad06e2c6e772a6d9cc950acf0fe4ba8a40d3 --tag ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-0d77ad06e2c6 --push .'` — exit 0.
- `sg docker -c 'docker --context default buildx imagetools inspect ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-0d77ad06e2c6'` — exit 0; registry digest and `linux/amd64` manifest recorded above.
- `sg docker -c 'docker --context default pull ghcr.io/aabrovarnik/ai-da-secretary-backend:sha-0d77ad06e2c6'` and image inspection — exit 0; revision label matched the exact source SHA.
- Pre-deploy rootful Docker `default` and Compose configuration were confirmed. `sg docker -c 'docker --context default compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet'` — exit 0; no Compose `build` sections. Resolved services were the new backend image, existing frontend tag `sha-292c1e8fb72d`, and `postgres:16-alpine`.
- A pre-change copy of `deploy/.env.sandbox` was saved as `/srv/ai-shared/web-sandbox/backups/deadline-hotfix-20261013T133955Z.env`, mode `600`. A normalized comparison verified that only `BACKEND_TAG` changed; the active env file remained mode `600`. Secret values were not printed or recorded.
- `sg docker -c 'docker --context default compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml pull backend'` — exit 0.
- `sg docker -c 'docker --context default compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml up -d --no-deps --no-build --force-recreate backend'` — exit 0; no other service was recreated.
- Backend startup and `sg docker -c 'docker --context default exec deploy-backend-1 npm run db:deploy'` both reported `No pending migrations to apply`; explicit check exit 0; no schema/data migration was applied.
- Initial post-deploy backend health: HTTP 200 on first retry; process and database checks `ok=true`.
- Runtime host checks after deployment/restart: localhost frontend HTTP 200; sandbox HTTPS HTTP 200; Academy HTTPS HTTP 200.

### Runtime acceptance

All probes used new synthetic `example.invalid` accounts and meetings. Tokens/passwords were excluded from output and report. The temporary fixture was removed after restart verification; the remaining matching synthetic-user count was 0.

| Probe | Result |
|---|---|
| Owner A PATCH with `dueDate=2026-02-31` | HTTP 400; Assignment stayed unchanged; `AssignmentHistory` remained at 0 |
| Owner A PATCH with `dueTime=29:99` | HTTP 400; Assignment stayed unchanged; `AssignmentHistory` remained at 0 |
| Candidate review with impossible date | HTTP 400; Candidate remained `pending`; no Assignment was created |
| Valid boundary PATCH `dueDate=2028-02-29`, `dueTime=23:59` | HTTP 200; stored as `2028-02-29T00:00:00.000Z` and `23:59`; exactly one history row created |
| User B PATCH against Owner A's meeting/assignment | HTTP 404; data/history unchanged |
| Backend-only restart and subsequent read | Health returned HTTP 200 on retry 3; valid boundary and the single history row persisted |
| Fixture cleanup | 2 synthetic meetings and 2 synthetic users deleted; follow-up query found 0 matching synthetic users |

### Preservation and final status

- New backend container ID: `ac89514477efe82c5d952c27f4c94a3cbd60fe60c009c47293e221ec02c9c96e`; image tag/digest/revision match the requested hotfix.
- Frontend container ID stayed `50aebc12e82207ad8beaf2b2c31cab31ba887b5b8af1e3fc3348c0585cd12614`; image remains `sha-292c1e8fb72d`.
- PostgreSQL container ID stayed `d9fc134d6ddf70aa083b94e09dd23aeb2de365f7f4b46019f2f478ab7e6331ca`, healthy; volume `deploy_sandbox-postgres-data` unchanged.
- Backend audio volume `deploy_sandbox-audio-data` unchanged. No volumes were removed or recreated.
- Frontend, PostgreSQL, Academy, Nginx/TLS, ports, secrets, and deployment topology were not changed.
- Pre-hotfix backend container ID: `a47dd1f262531a80254b229d450e4114d8d6e4254d3750295e0f7a77df3f3c7f`, using rollback image `sha-292c1e8fb72d`.
- `sg docker -c 'docker --context default compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml restart backend'` — exit 0; the restarted backend alone retained the validated assignment/history.
- `BACKEND_FIX_READY=YES` — requested validation, persistence, ownership, health, and preservation acceptance passed.
- `UI_ACCEPTANCE=PENDING_CODEX` — this backend-only follow-up did not perform a visual browser walkthrough; frontend was not changed.
- Follow-up hotfix status: **READY**. This does not retroactively erase the initial release FAIL or claim visual UI acceptance.
- PR #3 remains open; merge: NO. No email was sent.
