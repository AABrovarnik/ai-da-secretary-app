# TESLYA_TZ_P0_ESCALATION_AND_PRECHECK_2026-10-10.md

## Статус
По итогам unblock: DONE=NO. Runtime acceptance не запускать до снятия P0.

## Единственный P0
Нет доступного runtime execution context:
- отсутствует целевой каталог `/srv/ai-shared/web-sandbox/ai-da-secretary`;
- найденный checkout в workspace на другой ветке и с незакоммиченным изменением;
- `deploy/.env.sandbox` отсутствует.

## Задача на этот этап
Оформить и отправить оператору **строгий access request**, затем выполнить только precheck после выдачи доступа.

## Текст access request оператору (1-в-1)
Нужен доступ к runtime host/контексту для sandbox deploy проекта `AABrovarnik/ai-da-secretary-sandbox-deploy`.
Прошу предоставить:
1) подтверждённый runtime path: `/srv/ai-shared/web-sandbox/ai-da-secretary`;
2) права на чтение/запись этого path и запуск Docker Compose;
3) checkout репозитория на ветке `ai/deploy-image-only` без незакоммиченных изменений;
4) файл `deploy/.env.sandbox` (или доступ к secret channel, из которого он создаётся);
5) подтверждение, что sandbox route отделён от academy и можно выполнять только sandbox runtime acceptance.

Без этих пунктов runtime acceptance технически невыполним и будет снова READY=NO.

## Precheck после выдачи доступа (без full acceptance)
```bash
set -euo pipefail

REPO_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
cd "$REPO_DIR"

git status --short --branch
git rev-parse --abbrev-ref HEAD
git pull --ff-only

test -f deploy/.env.sandbox

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config >/tmp/compose.rendered.yml
```

## Критерий READY для этого этапа
- Access request отправлен оператору.
- После выдачи доступа precheck проходит без ошибок.

## Отчёт
Сформировать `QA_REPORT_P0_ESCALATION_AND_PRECHECK_2026-10-10.md`:
1. Preconditions
2. Access Request Sent (exact text)
3. Commands Executed
4. Exit Codes
5. READY Verdict (YES/NO)
6. Next Required Action (один P0, если остался)
