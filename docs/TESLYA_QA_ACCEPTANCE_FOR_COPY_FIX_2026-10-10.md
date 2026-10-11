# Тесля: QA Acceptance Template — COPY Fix

Используй этот шаблон для отчёта по задаче исправления `COPY` build-blocker.

## 1) META
- Repo:
- Base branch:
- Task branch:
- Commit SHA:
- Дата/время проверки (UTC):

## 2) SCOPE
- Что именно исправлялось:
- Что сознательно не менялось:

## 3) CHANGED FILES
Укажи только реально изменённые файлы:
- `<path>`
- `<path>`

## 4) DIFF SUMMARY
- Кратко: какие строки/пути `COPY` были неверны и как исправлены.
- Почему новая версия корректна для текущей структуры репозитория.

## 5) COMMAND LOG (обязательно с exit code)
Приведи команды и итог каждого шага:
1. `git status --short --branch` -> exit ?
2. `docker build ...` или `docker compose build ...` -> exit ?
3. `docker compose config` (если применимо) -> exit ?
4. Доп. проверки путей/файлов -> exit ?

Формат:
- `<команда>`
- stdout/stderr (кратко)
- `exit code: <n>`

## 6) CHECKS
- Build backend image: PASS/FAIL
- Build frontend image: PASS/FAIL
- Compose parse/config: PASS/FAIL
- Regression risk (deploy artifacts only): LOW/MEDIUM/HIGH

## 7) RISKS / BLOCKERS
- Что осталось рискованным:
- Что блокирует следующий этап (если есть):

## 8) DECISION
- COPY-fix READY: YES/NO
- Обоснование (1–3 пункта):

## 9) PR INFO (если push разрешён)
- Remote:
- PR URL:
- Merge status: NOT MERGED

---

## Acceptance criteria (для принятия)
Работа принимается, если одновременно выполнено:
1. Исправление минимальное и строго в границах deploy-артефактов.
2. Оба image build проходят без path/COPY ошибок.
3. Нет несогласованных системных действий (deploy, Nginx, TLS, server env).
4. Отчёт заполнен по шаблону полностью, с командами и exit code.