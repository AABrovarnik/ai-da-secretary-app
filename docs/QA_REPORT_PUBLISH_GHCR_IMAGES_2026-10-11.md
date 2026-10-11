# QA_REPORT — Публикация GHCR-образов AI-да-Секретарь

Дата: 2026-10-11 (UTC)  
Задача: опубликовать frontend/backend images в GHCR для sandbox runtime acceptance.

## 1. Preconditions

| Проверка | Результат | Статус |
|---|---|---|
| GitHub CLI authenticated as `AABrovarnik` | Да; token/scopes не включены в отчёт | PASS |
| Docker context | `rootless` | PASS |
| Целевой release tag | `runtime-20261011-01` | PASS (выбран для проверки) |
| Source repo с `apps/`, `docker/backend.Dockerfile`, `docker/frontend.Dockerfile` установлен | Нет. Найденные checkout'ы являются deployment-only и не содержат `apps/` | FAIL |
| GHCR manifest для backend tag | `docker manifest inspect` завершился ненулевым кодом | FAIL |
| GHCR manifest для frontend tag | `docker manifest inspect` завершился ненулевым кодом | FAIL |
| Неожиданные/чужие изменения | В deploy checkout есть незакоммиченный diff `docker/frontend.Dockerfile`; checkout `/srv/ai-shared/web-sandbox/ai-da-secretary` принадлежит root, Git сообщает `dubious ownership` | WARNING / BLOCKER |

Секреты не запрашивались и не выводились. Содержимое `.env.sandbox` не читалось.

## 2. Source repo/branch used

**Не установлен; сборка не запускалась.**

Проверенные сведения:

- `/home/aidev/.openclaw/workspace/ai-da-secretary-sandbox-deploy` — `origin` указывает на `AABrovarnik/ai-da-secretary-sandbox-deploy`, ветка `ai/fix-frontend-dockerfile-copy`; checkout содержит только `deploy/`, `docker/`, `nginx/`. Имеется незакоммиченный пользовательский diff в `docker/frontend.Dockerfile`, который не менялся.
- `/home/aidev/.openclaw/workspace/ai-da-secretary-image-only` — тот же deploy origin, ветка `ai/deploy-image-only`; source tree приложения отсутствует.
- `/srv/ai-shared/web-sandbox/ai-da-secretary` — Git origin тот же deploy repo, но каталог принадлежит root и обычные Git-команды остановлены Git-защитой `dubious ownership`. В нём тоже найден только deploy-набор, не source приложения.
- Dockerfiles ожидают monorepo paths `apps/backend`, `apps/frontend`, `apps/worker` и `prisma/`; такой source checkout в найденных каталогах отсутствует.
- GitHub repo search по `AI-da-Secretary` и `ai-da-secretary` не выявил отдельного application source repo среди доступных результатов.

Source branch не выбран; deployment repo не использован как build context. В `main` ничего не переключалось и не сливалось.

## 3. Build & push commands executed

Build/push команд не выполнял: исходный репозиторий и branch не подтверждены. Docker manifest checks выполнены только read-only:

```bash
docker manifest inspect ghcr.io/aabrovarnik/ai-da-secretary-backend:runtime-20261011-01
docker manifest inspect ghcr.io/aabrovarnik/ai-da-secretary-frontend:runtime-20261011-01
```

Обе проверки завершились ненулевым кодом; подробный stderr не сохранялся. Никакие registry login credentials, GitHub token или значения `.env.sandbox` в отчёт не включались.

## 4. Published image refs

Опубликованных образов этой задачей нет.

Предполагаемые имена (не подтверждены как опубликованные):

- `ghcr.io/aabrovarnik/ai-da-secretary-backend:runtime-20261011-01`
- `ghcr.io/aabrovarnik/ai-da-secretary-frontend:runtime-20261011-01`

## 5. Validation output (`manifest inspect`)

| Ref | Фактический результат |
|---|---|
| `ghcr.io/aabrovarnik/ai-da-secretary-backend:runtime-20261011-01` | FAIL — manifest inspect exit code `1` |
| `ghcr.io/aabrovarnik/ai-da-secretary-frontend:runtime-20261011-01` | FAIL — manifest inspect exit code `1` |

## 6. READY Verdict

**READY=NO** — оба образа не опубликованы и manifests не доступны; подтверждённого source repo/branch для сборки нет.

## 7. Next action

Предоставить точный clone URL и branch application source, где находятся `apps/`, `prisma/` и согласованные Dockerfiles. Либо восстановить доступность доверенного checkout и подтвердить его source remote/branch. После этого можно сделать Git pre-check в source checkout, собрать и опубликовать образы в GHCR и повторить `docker manifest inspect`.

Изменения sandbox deploy repo, включая незакоммиченный пользовательский Dockerfile diff, не выполнялись. Production academy не затрагивалась; merge в `main` не выполнялся.
