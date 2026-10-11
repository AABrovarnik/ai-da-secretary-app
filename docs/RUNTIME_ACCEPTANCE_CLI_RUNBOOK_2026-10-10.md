# RUNTIME_ACCEPTANCE_CLI_RUNBOOK_2026-10-10

## Scope
Image-only runtime acceptance для sandbox deploy проекта `AABrovarnik/ai-da-secretary-sandbox-deploy`.
Не трогать production route/конфиги academy.

## 0) SSH вход на сервер
```bash
ssh root@147.45.238.131
```

## 1) Подготовка checkout
```bash
set -euo pipefail

REPO_URL="git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git"
REPO_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
BRANCH="ai/deploy-image-only"

mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

if [ ! -d .git ]; then
  git clone "$REPO_URL" .
fi

git fetch --all --prune
git checkout "$BRANCH" || git checkout -b "$BRANCH" "origin/$BRANCH"
git pull --ff-only
```

## 2) Подготовка env
```bash
cd /srv/ai-shared/web-sandbox/ai-da-secretary

if [ ! -f deploy/.env.sandbox ]; then
  cp deploy/.env.sandbox.example deploy/.env.sandbox
  echo "Создан deploy/.env.sandbox из example. Заполните значения и повторите шаг 3."
  exit 2
fi
```

Минимально проверить, что заполнены критичные поля:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `FRONTEND_PORT`
- `BACKEND_PORT`
- `SESSION_SECRET`
- `ACCESS_TOKEN_TTL_HOURS`
- `OPENAI_API_KEY` (если нужен AI/ASR)

## 3) Runtime acceptance (commands-only)
```bash
cd /srv/ai-shared/web-sandbox/ai-da-secretary

set -euo pipefail

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config >/tmp/compose.rendered.yml

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml pull

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml up -d --no-build --pull always

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml ps

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml logs --tail=120

BACKEND_PORT=$(grep '^BACKEND_PORT=' deploy/.env.sandbox | cut -d= -f2)
FRONTEND_PORT=$(grep '^FRONTEND_PORT=' deploy/.env.sandbox | cut -d= -f2)

curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"
curl -I -fsS "http://127.0.0.1:${FRONTEND_PORT}/"
```

## 4) Быстрая проверка TLS/SNI (read-only)
```bash
openssl s_client -connect 127.0.0.1:443 -servername sandbox.xn--01-dlcyz9d7b.xn--p1ai </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
```

## 5) Что прислать в отчёт
Файл: `QA_REPORT_RUNTIME_ACCEPTANCE_2026-10-10.md`

Структура:
1. Preconditions
2. Commands Executed
3. Exit Codes
4. Observed Results
5. Risks/Blockers
6. READY Verdict (YES/NO)
7. Next Required Action (один P0, если NOT READY)

## Fail-fast правила
- Если `deploy/.env.sandbox` отсутствует -> STOP и фиксировать P0.
- Если `docker compose ... config` падает -> STOP и фиксировать P0.
- Если `pull`/`up` падает -> STOP и фиксировать P0.
- Если health probes не проходят -> READY=NO с одним ближайшим P0.
