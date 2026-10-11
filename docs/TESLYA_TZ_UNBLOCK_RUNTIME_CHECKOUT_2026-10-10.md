# TESLYA_TZ_UNBLOCK_RUNTIME_CHECKOUT_2026-10-10.md

## Контекст
По последнему QA: READY NO.
Единственный P0: отсутствует целевой runtime checkout `/srv/ai-shared/web-sandbox/ai-da-secretary` (commands-only остановился на `cd`, exit 1).

## Цель этапа
Снять P0-блокер: подтвердить корректный runtime path **или** создать checkout в целевом пути.

## Ограничения
- Не менять production academy конфиг/route.
- Не выполнять merge/force/reset destructive.
- Не печатать секреты.

## Команды (выполнить 1-в-1)
```bash
set -euo pipefail

REPO_URL="git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git"
TARGET_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
TARGET_BRANCH="ai/deploy-image-only"

# 1) Инвентаризация
pwd
whoami
hostname
ls -la /srv || true
ls -la /srv/ai-shared || true
ls -la /srv/ai-shared/web-sandbox || true

# 2) Если каталог отсутствует — создать
if [ ! -d "$TARGET_DIR" ]; then
  sudo mkdir -p "$TARGET_DIR"
  sudo chown -R "$(id -un):$(id -gn)" /srv/ai-shared/web-sandbox
fi

# 3) Инициализировать checkout при необходимости
if [ ! -d "$TARGET_DIR/.git" ]; then
  git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

# 4) Проверить remote и ветку деплоя
git remote -v
git fetch --all --prune
git checkout "$TARGET_BRANCH" || git checkout -b "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
git pull --ff-only

# 5) Минимальная валидация структуры
test -f deploy/docker-compose.sandbox.yml
ls -la deploy

# 6) Стоп-фактор для следующего этапа
if [ ! -f deploy/.env.sandbox ]; then
  echo "MISSING_ENV_SANDBOX"
fi
```

## Критерий DONE для этого этапа
- Путь `TARGET_DIR` существует и доступен.
- В `TARGET_DIR` валидный git checkout нужного репозитория.
- Ветка `ai/deploy-image-only` активна и синхронизирована.
- `deploy/docker-compose.sandbox.yml` найден.

## Отчёт
Сформировать `QA_REPORT_RUNTIME_CHECKOUT_UNBLOCK_2026-10-10.md`:
1. Preconditions
2. Commands Executed
3. Exit Codes
4. Observed Results
5. READY Verdict (YES/NO) для этапа unblock
6. Next Required Action (один P0, если остался)

Если этап DONE=YES, следующим шагом запускается `TESLYA_RUNTIME_ACCEPTANCE_COMMANDS_ONLY_2026-10-10.md`.
