# TESLYA_TZ_RUNTIME_ACCEPTANCE_SECRETS_READY_2026-10-10

## Контекст
Source-of-truth по деплою: GitHub-репозиторий `AABrovarnik/ai-da-secretary-sandbox-deploy`, ветка `main`.
Текущий этап: **runtime acceptance после подготовки секретов**.

## Задача
Провести runtime acceptance на сервере для WEB-песочницы, без изменений production-сайта academy.

## Ограничения
- Не изменять существующий production route/конфиг для academy.
- Не выполнять merge в `main` и не делать force/reset destructive-операции.
- Не публиковать секреты в отчёте (маскировать значения).

## Шаги (1-в-1)
1. Обновить код на сервере из `main` репозитория деплоя.
2. Проверить наличие и заполненность `deploy/.env.sandbox` (без вывода секретов в лог).
3. Проверить docker compose конфиг:
   - `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config`
4. Выполнить runtime запуск:
   - `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml up -d --build`
5. Проверить состояние контейнеров и health:
   - `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml ps`
   - `docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml logs --tail=120`
6. Выполнить smoke backend:
   - `curl -fsS http://127.0.0.1:<BACKEND_PORT>/health`
7. Выполнить smoke frontend:
   - `curl -I -fsS http://127.0.0.1:<FRONTEND_PORT>/`
8. Проверить Nginx/SNI разделение для `academy` и `sandbox` (без правок, только проверка):
   - active server_name
   - сертификат для sandbox
   - проксирование на localhost-порт frontend sandbox

## Критерии READY
- `docker compose config` без ошибок.
- Все контейнеры `Up`.
- Backend `/health` возвращает 200.
- Frontend отвечает 200/304.
- Nginx route для sandbox отделён от academy.
- TLS для sandbox валиден по имени хоста.

## Формат отчёта
Подготовить файл: `QA_REPORT_RUNTIME_ACCEPTANCE_2026-10-10.md` со структурой:
1. Preconditions
2. Commands Executed
3. Exit Codes
4. Observed Results
5. Risks/Blockers
6. READY Verdict (YES/NO)
7. Next Required Action

## Если NOT READY
Указать **ровно один** ближайший блокер класса P0 и минимальный следующий шаг для разблокировки.
