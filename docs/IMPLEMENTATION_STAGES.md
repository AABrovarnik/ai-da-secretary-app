# План реализации AI-да-Секретарь (этап 1)

## Stage 1.1 — Каркас и инфраструктура
- Монорепозиторий, frontend/backend/worker.
- Prisma schema + initial migration.
- Health с liveness/readiness.
- Базовые проверки typecheck/lint/test/build.

## Stage 1.2 — Текстовый конвейер и AI-кандидаты
- Аутентификация по email+password, сессии и logout.
- Встречи и материалы (text note/txt upload) с владением по userId.
- ProcessingRun со статусами queued/running/succeeded/failed.
- Реальный LLM-адаптер через backend (OpenAI) + серверная валидация schema 1.0.
- Честные ошибки при отсутствии ключа/ошибке провайдера.

## Stage 1.3 — Аудио и ASR
- Загрузка аудио и хранение в защищённом storage.
- Реальный ASR-адаптер с таймаутами/ретраями.
- Привязка цитат к источнику, сохранение транскрипта.

## Stage 1.4 — Экран проверки черновиков
- Раздельный UX: decisions / assignments / questions / information.
- Пустые и error-состояния, длительная обработка.

## Stage 1.5 — Подтверждение, редактирование, история
- Подтверждение/отклонение кандидатов без дублей.
- Assignment status lifecycle: new/in_progress/done/cancelled.
- История изменений и защита подтверждённых результатов.

## Stage 1.6 — Приёмка M-01..M-16
- Unit/API/E2E + регрессии.
- Проверки с реальными провайдерами (LLM/ASR).
- Отчёт `docs/ACCEPTANCE_STAGE1.md`.