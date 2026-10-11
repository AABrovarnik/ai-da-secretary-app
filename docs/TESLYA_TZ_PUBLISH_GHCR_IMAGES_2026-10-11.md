# TESLYA_TZ_PUBLISH_GHCR_IMAGES_2026-10-11.md

## Факт
Runtime acceptance image-only блокируется не доступом, а отсутствием образов в GHCR:
- `ghcr.io/aabrovarnik/ai-da-secretary-frontend:*` -> `manifest unknown`
- `ghcr.io/aabrovarnik/ai-da-secretary-backend:*` -> `manifest unknown`

## Цель
Опубликовать рабочие Docker-образы frontend/backend в GHCR и вернуть точные теги для `deploy/.env.sandbox`.

## Ограничения
- Не менять production academy.
- Не делать merge в main без отдельного разрешения.
- Не печатать секреты в отчёте.

## Что сделать
1. Подтвердить source-репозиторий приложения (где есть `apps/`, `docker/backend.Dockerfile`, `docker/frontend.Dockerfile`).
2. Собрать образы и запушить в GHCR под owner `aabrovarnik`.
3. Использовать единый тег релиза, например: `runtime-20261011-01`.
4. Проверить доступность тегов командой `docker manifest inspect`.
5. Вернуть 4 строки для `.env.sandbox`:
   - `BACKEND_IMAGE=...`
   - `BACKEND_TAG=...`
   - `FRONTEND_IMAGE=...`
   - `FRONTEND_TAG=...`

## Минимальная проверка (должна пройти)
```bash
docker manifest inspect ghcr.io/aabrovarnik/ai-da-secretary-frontend:<TAG> >/dev/null
docker manifest inspect ghcr.io/aabrovarnik/ai-da-secretary-backend:<TAG> >/dev/null
```

## Формат отчёта
Файл: `QA_REPORT_PUBLISH_GHCR_IMAGES_2026-10-11.md`

Разделы:
1. Preconditions
2. Source repo/branch used
3. Build & push commands executed
4. Published image refs
5. Validation output (`manifest inspect`)
6. READY Verdict (YES/NO)
7. Next action

## Критерий READY
READY=YES только если опубликованы оба образа и подтверждены точные теги, пригодные для `deploy/.env.sandbox`.
