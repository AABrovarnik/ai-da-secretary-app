# PROJECT_STATE

## Дата обновления
2026-10-11

## Статус итераций Stage 1
- 1.1 Каркас, БД, актуальный контекст: **done**
- 1.2 Текстовый конвейер + реальный LLM: **in progress (foundation implemented)**
- 1.3 Аудио ASR + очередь: **in progress (audio upload + ASR foundation added)**
- 1.4 UI встреч и черновиков: **done**
- 1.5 Проверка/подтверждение и история изменений: **in progress (review foundation implemented)**
- 1.6 Приёмка M-01…M-16: not started

## Реализовано
- Workspace-проект: `apps/frontend`, `apps/backend`, `apps/worker`.
- Prisma schema + migration для сущностей первого этапа.
- Auth API: register/login/logout, server-side sessions.
- Meetings API: create/list/get.
- Text materials API + processing run API.
- Audio materials API + audio processing run API (`ASR -> LLM`).
- LLM adapter (OpenAI) на backend + Zod-валидация schema 1.0.
- Добавлен optional model override на уровне processing run (текст/аудио) при сохранении default `OPENAI_MODEL`.
- ASR adapter (OpenAI transcription) с сохранением транскрипции в `Material.contentText`.
- Review-screen для редактирования и индивидуального approve/reject решений, поручений, вопросов и информации.
- Транзакционное подтверждение кандидата: создаются только одобренные `Decision` и `Assignment`, записывается `CandidateHistory`.
- Проверка evidence на принадлежность материалам той же встречи и защита от повторного review (`409`).
- Архив проверенных кандидатов и просмотр подтверждённых результатов встречи.
- Без ключа AI/ASR возвращается честная ошибка, без фиктивного результата.

## Проверки (факт)
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test` — passed.
- `npm run build` — passed.

Проверки повторно выполнены 2026-10-11 после стабилизации backend runtime. Первый запуск `test/build` в ограниченном Windows-процессе завершился `spawn EPERM`; повторный запуск вне sandbox прошёл успешно.

## Блокеры/открытые пункты
- `npm run db:migrate` требует локально доступный PostgreSQL; в текущем окружении миграция на пустую БД не подтверждена.
- Runtime E2E нового review/approve flow и его ownership/duplicate-review проверок ещё не выполнен.
- Assignment lifecycle после подтверждения (статусы выполнения и журнал действий) ещё не реализован.
- Полные M-критерии и security hardening ещё не закрыты.

## Тестовый контур
- `docs/TEST_CONTOUR.md` описывает ручной UI прогон и smoke-скрипт.
- `scripts/smoke-audio.ps1` поддерживает `.ogg` для e2e оценки.

## WEB-песочница (deployment focus)
- Для sandbox-деплоя добавлены Dockerfiles и deploy/docker-compose.sandbox.yml.
- Добавлен runbook: deploy/WEB_SANDBOX_DEPLOY.md.
- `https://sandbox.вишня01.рф/` опубликован через отдельный Nginx vhost с валидным TLS-сертификатом.
- На runtime host подтверждены frontend `HTTP 200` и backend `/health` со статусом `ok`, включая readiness PostgreSQL.
- Backend runtime стабилизирован: Debian/OpenSSL-совместимый Prisma engine, корректный compiled entrypoint и ESM-совместимый импорт `bcryptjs`.
- Sandbox работает на immutable GHCR images; следующий обязательный шаг — выпустить образы review-итерации и выполнить runtime E2E.
