# PROJECT_STATE

## Дата обновления
2026-10-09

## Статус итераций Stage 1
- 1.1 Каркас, БД, актуальный контекст: **done**
- 1.2 Текстовый конвейер + реальный LLM: **in progress (foundation implemented)**
- 1.3 Аудио ASR + очередь: **in progress (audio upload + ASR foundation added)**
- 1.4 UI встреч и черновиков: in progress (базовый UI есть, полноценный review-screen нет)
- 1.5 Проверка/подтверждение и история изменений: not started
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
- Без ключа AI/ASR возвращается честная ошибка, без фиктивного результата.

## Проверки (факт)
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test` — passed.
- `npm run build` — passed.

## Блокеры/открытые пункты
- `npm run db:migrate` требует локально доступный PostgreSQL; в текущем окружении миграция на пустую БД не подтверждена.
- Полные M-критерии (особенно review/approve flow, security hardening, E2E) ещё не закрыты.

## Тестовый контур
- `docs/TEST_CONTOUR.md` описывает ручной UI прогон и smoke-скрипт.
- `scripts/smoke-audio.ps1` поддерживает `.ogg` для e2e оценки.

## WEB-песочница (deployment focus)
- Для sandbox-деплоя добавлены Dockerfiles и deploy/docker-compose.sandbox.yml.
- Добавлен runbook: deploy/WEB_SANDBOX_DEPLOY.md.
- По отчёту агента: DNS для sandbox уже резолвится, осталось настроить отдельный Nginx vhost + TLS-сертификат.
