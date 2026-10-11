# QA_REPORT_RUNTIME_ACCEPTANCE_2026-10-10

## 1. Preconditions

- Целевой репозиторий: `AABrovarnik/ai-da-secretary-sandbox-deploy`.
- Безопасная task branch: `ai/deploy-image-only`, HEAD `6d8e315` (`feat: switch sandbox deploy to prebuilt images`).
- Runtime path из commands-only файла `/srv/ai-shared/web-sandbox/ai-da-secretary` отсутствует на execution host (`cd` exit 1). Это не подтверждённый sandbox server context.
- `deploy/.env.sandbox` отсутствует как в целевом runtime path, так и в task checkout.
- Secret Store metadata check сообщил, что store пуст. Значения credentials не запрашивались, не читались и не печатались.
- Соседний checkout того же репозитория `/home/aidev/.openclaw/workspace/ai-da-secretary-sandbox-deploy` находится на `ai/fix-frontend-dockerfile-copy` с изменённым `docker/frontend.Dockerfile`; он оставлен нетронутым.
- Цикл ограничен image-only без build; academy production route не затрагивался.

## 2. Commands Executed

Выполненные команды и проверки:

```text
git status --short --branch                         # task branch
git log -1 --oneline
git branch -vv
test -f deploy/.env.sandbox
sed -n ... deploy/docker-compose.sandbox.yml
sed -n ... deploy/.env.sandbox.example
sed -n ... deploy/RUNTIME_PRECHECK.md
rg -n 'sandbox|academy|server_name|ssl_certificate|proxy_pass|18080|18081' nginx deploy README.md
```

Также буквально начат commands-only блок:

```text
cd /srv/ai-shared/web-sandbox/ai-da-secretary
```

Он завершился ошибкой отсутствующего пути. Вложенный shell-script остановлен до `git fetch`, согласно его `set -euo pipefail`; остальные команды не выполнены и не маскируются под проверки локального checkout.

Выполнена metadata-only проверка Secret Store `list`; содержимое секретов не читалось.

## 3. Exit Codes

| Команда/проверка | Exit code | Результат |
|---|---:|---|
| `git status --short --branch` в task checkout | 0 | Чистая ветка `ai/deploy-image-only` |
| `git log -1 --oneline` | 0 | HEAD `6d8e315` |
| `git branch -vv` | 0 | Task branch отслеживает `origin/ai/deploy-image-only`; соседний checkout отмечен отдельно |
| `test -f deploy/.env.sandbox` | 1 | Файл отсутствует |
| `cd /srv/ai-shared/web-sandbox/ai-da-secretary` | 1 | Целевой runtime checkout отсутствует |
| Secret Store metadata `list` | n/a | Ответ: store empty |
| `git fetch --all --prune`, checkout, pull | NOT RUN | Shell остановлен после неудачного `cd` (`set -e`) |
| Compose config / pull / up / ps / logs | NOT RUN | Целевой runtime checkout и env отсутствуют; shell остановлен до команд |
| Frontend/backend curl | NOT RUN | Стек не запускался |
| TLS probe из commands-only файла | NOT RUN | Целевой sandbox runtime hostname/context не установлен; не подменялся проверкой текущего execution host |

## 4. Observed Results

- Compose-файл в task branch использует prebuilt backend/frontend images с обязательными image tags и публикует порты на loopback (`FRONTEND_PORT`, `BACKEND_PORT`).
- В `.env.sandbox.example` image tags placeholder; реального `.env.sandbox` рядом нет.
- В Secret Store не зарегистрированы credentials. Фактический pull доступ этим запуском не подтверждён.
- Из commands-only sequence выполнен только переход в заданный runtime path; он заблокирован отсутствующим каталогом. Git fetch/checkout/pull, Compose и smoke команды не выполнялись.
- Runtime acceptance не состоялся: ни образы, ни контейнеры, ни API workflow не проверены.
- Изменений production academy, системного Nginx/TLS и файлов приложения не производилось. Изменён только этот отчёт.

## 5. Risks/Blockers

- **P0 — целевой runtime checkout `/srv/ai-shared/web-sandbox/ai-da-secretary` недоступен/отсутствует.** Поэтому commands-only последовательность останавливается до загрузки кода и runtime проверок.

## 6. READY Verdict

**READY: NO** — runtime acceptance не подтверждён.

## 7. Next Required Action

Предоставить/подключить фактический sandbox runtime host с checkout по указанному пути и подготовленным `deploy/.env.sandbox` плюс pull credentials через защищённый канал; затем повторить sequence в разрешённом image-only scope (`up -d --no-build --pull always`).
