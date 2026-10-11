# ТЗ Тесле: immutable runtime release и acceptance

## Цель
Собрать и развернуть воспроизводимый sandbox release приложения «AI-да-Секретарь» из проверенной task branch, заменив временные локальные Docker images на immutable GHCR images.

## Источники истины
- Application repository: `git@github.com:AABrovarnik/ai-da-secretary-app.git`.
- Source branch: `codex/stabilize-stage1-runtime`.
- Deployment repository: `git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git`.
- Runtime path: `/srv/ai-shared/web-sandbox/ai-da-secretary`.
- Application source checkout: `/srv/ai-shared/web-sandbox/ai-da-secretary-app-src`.

## Ограничения
- Не изменять academy vhost, academy containers и academy TLS.
- Не выполнять merge, `reset --hard`, очистку volumes или удаление PostgreSQL data.
- Не выводить `OPENAI_API_KEY`, `GHCR_READ_TOKEN`, `SESSION_SECRET` и другие секреты в отчёт или логи.
- Не изменять пользовательские незакоммиченные файлы; при dirty checkout остановиться и зафиксировать P0.
- Использовать только image tags, связанные с полным commit SHA source branch.

## Шаги
1. Проверить SSH host fingerprint и перейти в application source checkout.
2. Выполнить `git status --short`, `git remote -v`, `git fetch --all --prune`.
3. Переключиться на `codex/stabilize-stage1-runtime` только при чистом checkout.
4. Зафиксировать полный `SOURCE_SHA=$(git rev-parse HEAD)` и `SHORT_SHA=$(git rev-parse --short=12 HEAD)`.
5. Выполнить `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
6. Собрать backend и frontend images с tags `sha-${SHORT_SHA}` из Dockerfiles репозитория.
7. Проверить локальный backend image запуском миграции на sandbox PostgreSQL и `/health`; не использовать production/academy database.
8. Опубликовать оба images в `ghcr.io/aabrovarnik` и проверить их через `docker manifest inspect`.
9. В deployment checkout создать резервную копию `deploy/.env.sandbox` с правами `600` и изменить только четыре поля `BACKEND_IMAGE`, `BACKEND_TAG`, `FRONTEND_IMAGE`, `FRONTEND_TAG`.
10. Выполнить `docker compose config`, затем `pull` и `up -d --no-build --pull always` только для sandbox compose project.
11. Проверить `docker compose ps`, backend logs, `http://127.0.0.1:18081/health`, `http://127.0.0.1:18080/` и `https://sandbox.вишня01.рф/`.
12. Перезапустить только sandbox backend/frontend containers и повторить health checks, не перезапуская host и Nginx без необходимости.

## Критерии READY=YES
- Все source checks завершились с exit code `0`.
- Оба GHCR manifests существуют и их digests записаны в отчёт.
- Compose использует tags `sha-${SHORT_SHA}`, а не `latest`, `dev-*` или старые runtime tags.
- PostgreSQL healthy, backend `/health` возвращает `status=ok` и `database.ok=true`.
- Frontend отвечает `HTTP 200` локально и через HTTPS sandbox domain.
- После recreate контейнеров проверки остаются успешными.

## Отчёт
Создать `docs/QA_REPORT_IMMUTABLE_RUNTIME_RELEASE_2026-10-11.md`. Указать source SHA, image refs/digests, выполненные команды и exit codes, итог `READY=YES/NO`, ровно один P0 при остановке и минимальное следующее действие. Секреты и содержимое `.env.sandbox` не включать.
