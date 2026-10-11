# ТЗ для Тесли: переход sandbox deploy на image-only модель

## Контекст
- Текущий source-of-truth deploy-репозиторий: `AABrovarnik/ai-da-secretary-sandbox-deploy` (`main`).
- По QA: `COPY`-путь исправлен, но `READY: NO`, так как в deploy-репозитории отсутствует source tree приложения для local `docker build`.
- Цель: исключить build-from-source в deploy-репо и перейти на image-only деплой.

## Цель задачи
Подготовить изменения deploy-репозитория так, чтобы sandbox разворачивался из **готовых контейнерных образов** (frontend/backend), без локальной сборки из исходников.

## Обязательные границы
Разрешено:
- создать task branch от `main`;
- менять только deploy-артефакты (`deploy/*`, при необходимости `README.md` в deploy-repo);
- подготовить QA-отчёт и diff;
- при отдельном разрешении — push branch и открыть PR без merge.

Запрещено на этом этапе:
- серверный деплой;
- правки системного Nginx/TLS;
- создание/редактирование серверного `.env`;
- `reset --hard` без отдельного согласования.

## Что нужно сделать
1. В task branch обновить `deploy/docker-compose.sandbox.yml`:
   - убрать `build:` для frontend/backend;
   - использовать `image:` для frontend/backend;
   - добавить переменные тегов/имен образов через `.env.sandbox`.
2. Обновить `deploy/.env.sandbox.example`:
   - добавить переменные вида `BACKEND_IMAGE`, `BACKEND_TAG`, `FRONTEND_IMAGE`, `FRONTEND_TAG` (или эквивалентно, но явно).
3. Обновить deploy-документацию:
   - как публикуются образы;
   - какие теги указывать для sandbox;
   - как делать rollback на предыдущий tag.
4. Проверить, что compose конфиг валиден без build-context.

## Минимальные QA-проверки (обязательно)
- `docker compose --env-file .env.sandbox -f deploy/docker-compose.sandbox.yml config --quiet` -> exit 0
- Проверка, что в compose нет `build:` у frontend/backend.
- Проверка, что все нужные image-переменные документированы в `.env.sandbox.example`.
- Отчёт по шаблону QA с командами и exit code.

## Deliverables
1. Название task branch.
2. Список изменённых файлов.
3. Краткий diff summary.
4. QA отчёт в формате нашего шаблона (`READY/NOT READY` для image-only задачи).
5. PR URL (только если push разрешён отдельно).

## Критерии приёмки
Задача принимается, если:
- deploy compose не зависит от исходников приложения;
- frontend/backend задаются только через image+tag;
- `.env.sandbox.example` и документация полностью покрывают запуск/rollback;
- QA-проверки подтверждены командами и exit codes;
- серверные изменения не выполнялись.