# PROJECT_STATE

## Дата обновления
2026-10-13

## Статус итераций Stage 1
- 1.1 Каркас, БД, актуальный контекст: **done**
- 1.2 Текстовый конвейер + реальный LLM: **in progress (foundation implemented)**
- 1.3 Аудио ASR + очередь: **in progress (audio upload + ASR foundation added)**
- 1.4 UI встреч и черновиков: **done**
- 1.5 Проверка/подтверждение и история изменений: **in progress (assignment lifecycle implemented; runtime E2E pending)**
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
- Отредактированные дата, время и часовой пояс поручения сохраняются и корректно отображаются после подтверждения.
- Транзакционное подтверждение кандидата: создаются только одобренные `Decision` и `Assignment`, записывается `CandidateHistory`.
- Проверка evidence на принадлежность материалам той же встречи и защита от повторного review (`409`).
- Архив проверенных кандидатов и просмотр подтверждённых результатов встречи.
- Владелец может редактировать подтверждённое поручение и менять его статус между `new`, `in_progress`, `done`, `cancelled`.
- Каждое изменение поручения транзакционно записывается в `AssignmentHistory` с автором, временем, прежними/новыми значениями и списком полей.
- В UI добавлены поиск поручений, фильтр по статусу, история и вычисляемая с учётом часового пояса просрочка активных задач.
- Backend семантически проверяет сроки: несуществующие календарные даты и время вне `00:00–23:59` отклоняются как в review, так и при последующем PATCH поручения.
- Без ключа AI/ASR возвращается честная ошибка, без фиктивного результата.

## Проверки (факт)
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run test` — passed.
- `npm run build` — passed.

Для assignment lifecycle 2026-10-13 выполнены `npm run db:generate`, `npm run typecheck`, `npm run lint`, `npm test` и `npm run build`: typecheck/lint/build passed. После исправления семантической проверки сроков итоговый набор содержит 20 passed tests. В промежуточном прогоне старый health-тест один раз превысил лимит на 89 мс при недоступной локальной БД; отдельный и итоговые полные повторы прошли. Первый запуск Vitest в ограниченном Windows-процессе завершился `spawn EPERM`; разрешённый повтор прошёл успешно.

## Блокеры/открытые пункты
- `npm run db:migrate` требует локально доступный PostgreSQL; в текущем окружении миграция на пустую БД не подтверждена.
- Runtime E2E нового assignment lifecycle, ownership PATCH и forward-only миграции ещё не выполнен.
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
