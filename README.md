# AI-да-Секретарь

AI-да-Секретарь — веб-приложение для извлечения решений и поручений из материалов встречи с обязательным подтверждением человеком.

## Статус
Реализованы этапы:
- **1.1**: каркас приложения, Prisma-схема, health, базовые проверки.
- **1.2 foundation**: auth, встречи, текстовые материалы, запуск AI-processing run и сохранение `ResultCandidate`.
- **1.3 foundation**: загрузка аудио (включая `.ogg`) и ASR+LLM pipeline для последнего аудио.
- **1.4**: рабочее пространство встреч, экран проверки AI-черновика и архив проверок.
- **1.5 in progress**: проверка AI-черновиков, подтверждённые поручения, их статусы и история изменений.

## Стек
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript + Zod + Prisma
- Worker: Node.js + Express + TypeScript
- DB: PostgreSQL
- Tests: Vitest + Supertest
- E2E foundation: Playwright config

## Возможности сейчас
- Регистрация/вход/выход через backend (`/api/auth/*`).
- Создание и просмотр встреч (`/api/meetings`).
- Добавление текстового материала к встрече.
- Добавление аудио-материала (`multipart/form-data`) к встрече.
- Запуск AI-обработки последнего текста с ручным выбором default-модели и optional override на конкретный run.
- Запуск ASR+AI обработки последнего аудио с optional override модели LLM на уровне run.
- Статус обработки через polling `ProcessingRun`.
- Редактирование AI-черновика с подтверждением или отклонением каждого решения, поручения, вопроса и информационного пункта.
- Создание подтверждённых `Decision` и `Assignment` только после проверки человеком.
- История проверки кандидата и защита от повторного подтверждения.
- Редактирование подтверждённых поручений: текст, исполнитель, срок, часовой пояс и статусы `new/in_progress/done/cancelled`.
- История изменений поручения, поиск, фильтр статуса и отметка просрочки для активных задач.
- Проверка владения данными: пользователь видит/меняет только свои встречи.

## Ограничения
- Без `OPENAI_API_KEY` обработка завершится честной ошибкой конфигурации (без демо-ответа).
- Runtime E2E нового assignment lifecycle и итоговая приёмка M-01…M-16 ещё не завершены.
- Security hardening из итоговой приёмки (CSRF, ограничение попыток входа и документированное создание пользователей) остаётся открытым.

## Запуск
1. Node.js 20+
2. `copy .env.example .env`
3. Настроить `DATABASE_URL` и `SESSION_SECRET`
4. Установить зависимости: `npm install`
5. Prisma:
   - `npm run db:generate`
   - `npm run db:migrate`
6. Запуск (отдельные терминалы):
   - backend: `npm --workspace apps/backend run dev`
   - frontend: `npm --workspace apps/frontend run dev`
   - worker: `npm --workspace apps/worker run dev`

## Проверки
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## Health
- Backend: `GET /health`
- Worker: `GET /health`

Оба health-эндпоинта различают:
- живой процесс (`checks.process.ok`)
- готовность инфраструктуры (`checks.database.ok`)

## Тестовый контур
- UI-контур: `apps/frontend/src/App.tsx`
- Smoke-скрипт: `scripts/smoke-audio.ps1`
- Инструкция: `docs/TEST_CONTOUR.md`
