# ТЗ для Тесли: image-only branch push + PR + runtime precheck

## Контекст
- Предыдущий QA по задаче image-only принят как `READY WITH WARNINGS`.
- Runtime acceptance пока `NOT READY` из-за отсутствия подтверждённых image refs/tags и package-access.
- Текущий task branch: `ai/deploy-image-only`.

## Цель
1) Запушить task branch в GitHub и открыть PR (без merge).
2) Подготовить проверяемый runtime precheck-чеклист, который снимает блокеры для следующего этапа `pull -> up -> smoke`.

## Границы
Разрешено:
- git push task branch;
- создание PR без merge;
- обновление/добавление документации в deploy-repo для runtime precheck;
- read-only проверки доступности package refs/tags.

Не разрешено:
- деплой на сервер;
- изменения системного Nginx/TLS;
- создание/правка server `.env`;
- merge PR в `main`.

## Обязательные действия
1. Запушить `ai/deploy-image-only` в remote `origin`.
2. Создать PR в `main` с кратким описанием:
   - что изменено,
   - какие проверки выполнены,
   - какие блокеры остались.
3. Добавить в deploy-repo отдельный документ `deploy/RUNTIME_PRECHECK.md` с обязательными пунктами:
   - точные `BACKEND_IMAGE` / `FRONTEND_IMAGE` значения;
   - правила immutable tagging (SHA/release tag);
   - как проверить, что образы существуют в registry;
   - требования к pull auth (`read:packages`/robot token);
   - последовательность команд для precheck перед runtime (`compose config`, `compose pull`, `compose up --no-build`, smoke endpoints);
   - критерии PASS/FAIL для перехода к runtime acceptance.
4. Обновить PR body ссылкой на `deploy/RUNTIME_PRECHECK.md`.

## Минимальные проверки (с exit code)
- `git status --short --branch`
- `git push -u origin ai/deploy-image-only`
- команда создания PR (или эквивалент) + URL PR
- read-only проверка image refs/tags (без server rollout)
- `git diff --check`

## Формат отчёта
Использовать QA-формат с секциями:
1. META
2. SCOPE
3. CHANGED FILES
4. DIFF SUMMARY
5. COMMAND LOG (все команды + exit code)
6. CHECKS
7. RISKS/BLOCKERS
8. DECISION (`READY/NOT READY` именно для push+PR+precheck)
9. PR INFO (URL обязательно)

## Критерии приёмки
Задача принимается, если:
- branch запушен;
- PR создан и не смержен;
- `deploy/RUNTIME_PRECHECK.md` добавлен и покрывает все обязательные пункты;
- отчёт содержит команды и exit codes;
- серверные/system изменения не выполнялись.