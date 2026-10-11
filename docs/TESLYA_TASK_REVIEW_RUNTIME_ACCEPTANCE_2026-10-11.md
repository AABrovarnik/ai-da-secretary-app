# ТЗ Тесле: immutable release и runtime acceptance review-flow

## Цель
Опубликовать review-итерацию AI-да-Секретаря в sandbox и доказать реальным API/UI-прогоном, что редактирование, approve/reject, ownership и история работают без регрессий.

## Источники истины
- Application repo: `git@github.com:AABrovarnik/ai-da-secretary-app.git`.
- Application branch: `codex/stage1-review-screen` (PR открыть без merge).
- Deployment repo: `git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git`.
- Deployment branch: `ai/deploy-image-only`.
- Runtime path: `/srv/ai-shared/web-sandbox/ai-da-secretary`.
- App source checkout: `/srv/ai-shared/web-sandbox/ai-da-secretary-app-src`.

## Ограничения
- Не выполнять merge ни одного PR.
- Не менять production/Academy, системный Nginx и TLS.
- Не удалять и не пересоздавать PostgreSQL volume или audio volume.
- Не выводить значения секретов и содержимое `deploy/.env.sandbox` в отчёт.
- Не использовать `reset --hard`; при незакоммиченных изменениях остановиться и указать один P0.
- Работать через system Docker context `default` от пользователя `aidev` с группой `docker`.

## Pre-check
1. Проверить чистоту обоих checkout, текущие branches и remotes.
2. Получить application branch и зафиксировать полный commit SHA.
3. Выполнить `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
4. Убедиться, что sandbox backend/frontend/PostgreSQL до релиза находятся в healthy/up состоянии.

## Immutable images
1. Собрать backend и frontend строго из application commit SHA.
2. Использовать одинаковый immutable tag формата `sha-<12 первых символов commit SHA>`.
3. Frontend собирать с `VITE_API_BASE_URL=/api`.
4. Опубликовать оба образа в GHCR:
   - `ghcr.io/aabrovarnik/ai-da-secretary-backend:<tag>`
   - `ghcr.io/aabrovarnik/ai-da-secretary-frontend:<tag>`
5. Подтвердить оба remote manifest через `docker manifest inspect`.

## Sandbox deploy
1. Изменить в runtime `deploy/.env.sandbox` только `BACKEND_IMAGE`, `BACKEND_TAG`, `FRONTEND_IMAGE`, `FRONTEND_TAG`.
2. Выполнить image-only `docker compose pull` и `up -d --no-build --pull always` через context `default`.
3. Не выполнять `down -v` и любые операции удаления volumes.
4. Подтвердить `docker compose ps`, backend `/health`, frontend localhost HTTP 200 и публичный `https://sandbox.вишня01.рф/` HTTP 200.

## Runtime E2E review
1. Создать временного пользователя A, встречу и текстовый материал с решением, поручением, вопросом и информационным пунктом.
2. Запустить processing и дождаться `succeeded`; получить pending candidate.
3. В review request изменить формулировку одного пункта, одобрить минимум одно решение и одно поручение, отклонить минимум один другой пункт.
4. Проверить HTTP 200 review endpoint и появление только одобренных `Decision`/`Assignment`.
5. Проверить сохранение отредактированного `payloadJson`, массива действий `payloadJson.review` и записи `CandidateHistory`.
6. Повторить PUT review того же candidate и подтвердить HTTP 409.
7. Создать пользователя B и подтвердить, что чтение встречи A и review candidate A недоступны (HTTP 404).
8. Открыть sandbox UI и подтвердить: review-screen, редактирование, кнопки подтверждения/отклонения, итоговые результаты и архив проверок.
9. Перезапустить только sandbox backend/frontend и повторить health + чтение подтверждённых результатов; данные должны сохраниться.

## Отчёт
Создать `QA_REPORT_REVIEW_RUNTIME_ACCEPTANCE_2026-10-11.md` со следующими разделами:
- commit SHA и image refs/digests;
- команды и exit codes без секретов;
- результаты static checks и manifests;
- результаты deploy/health/public HTTPS;
- ID временных meeting/run/candidate и HTTP-коды E2E;
- подтверждение сохранности volumes и отсутствия изменений Academy;
- итог `READY=YES` или ровно один P0 и минимальное следующее действие.
