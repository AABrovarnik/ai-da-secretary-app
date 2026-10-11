# ТЗ для Тесли: Runtime Acceptance после выдачи GHCR-доступа

## Контекст
- Source-of-truth: `AABrovarnik/ai-da-secretary-sandbox-deploy`.
- PR image-only подготовлен: https://github.com/AABrovarnik/ai-da-secretary-sandbox-deploy/pull/1
- Блокер снят частично: GHCR доступ выдан (read:packages/credentials предоставлены).
- Требуется подтвердить runnable runtime в sandbox без правок системного Nginx/TLS на этом шаге.

## Цель этапа
Подтвердить runtime acceptance по image-only сценарию:
1) `pull` образов проходит;
2) `up --no-build` поднимает стек;
3) базовые health/API/UI проверки проходят;
4) smoke `.ogg` workflow выполняется до финального статуса run.

## Границы
Разрешено:
- действия в рамках deploy repo и docker compose sandbox;
- использование предоставленных GHCR credentials только для pull;
- запуск и остановка sandbox compose-стека.

Не разрешено:
- merge PR в `main`;
- правки системного Nginx/TLS;
- изменения production/academy контуров;
- публикация секретов в отчёте.

## Обязательные действия
1. Checkout task branch `ai/deploy-image-only`.
2. Подготовить `deploy/.env.sandbox` с реальными `BACKEND_IMAGE/BACKEND_TAG/FRONTEND_IMAGE/FRONTEND_TAG` и прочими обязательными переменными.
3. Проверить конфиг:
   - `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet`
4. Выполнить pull образов:
   - `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml pull`
5. Поднять стек без build:
   - `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml up -d --no-build --pull always`
6. Проверить runtime:
   - frontend `http://127.0.0.1:18080/`
   - backend health `http://127.0.0.1:18081/health`
   - API auth/meeting flow readiness
7. Выполнить `.ogg` smoke:
   - register/login
   - create meeting
   - upload `.ogg`
   - start `process-latest-audio`
   - дождаться `ProcessingRun.status = succeeded|failed` (зафиксировать факт и причину)
8. Собрать артефакты проверки и очистить секреты из вывода.

## Минимальные проверки (обязательно с exit code)
- `docker compose ... config --quiet`
- `docker compose ... pull`
- `docker compose ... up -d --no-build --pull always`
- `curl -I http://127.0.0.1:18080/`
- `curl -s http://127.0.0.1:18081/health`
- команды smoke-flow (или эквивалентные API шаги)
- `docker compose ... ps`
- `docker compose ... logs --no-color --tail=200` (без утечки секретов)

## Формат отчёта
1. META
2. SCOPE
3. CHANGED FILES (если были)
4. COMMAND LOG (все команды + exit code)
5. CHECKS (PASS/WARNING/FAIL)
6. SMOKE RESULT (.ogg workflow)
7. RISKS/BLOCKERS
8. DECISION (`READY/NOT READY` для runtime acceptance)
9. PR INFO (если есть изменения)

## Критерии приёмки
Runtime acceptance считается пройденным, если одновременно:
- pull image проходит;
- стек поднят без build;
- frontend и backend health доступны локально;
- `.ogg` smoke завершён и результат прозрачно зафиксирован;
- нет несогласованных системных изменений.

Иначе статус: `NOT READY` с точным блокером и предложением следующего шага.