# Unblock Тесли: сохранить dirty checkout и подготовить release

## Авторизация
Оператор разрешает сохранить текущие незакоммиченные изменения обоих checkout через именованные Git stash. Удаление, `reset --hard`, `git clean` и применение stash не разрешены.

## Кто выполняет
Тесля выполняет команды от пользователя `aidev`. Root-доступ для этого шага не требуется.

## Команды
Выполнить блок целиком:

```bash
set -euo pipefail

APP_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary-app-src"
DEPLOY_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
SOURCE_BRANCH="codex/stabilize-stage1-runtime"
DEPLOY_BRANCH="ai/deploy-image-only"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

test "$(id -un)" = "aidev"
test -d "$APP_DIR/.git"
test -d "$DEPLOY_DIR/.git"

echo "=== SAVE APP WORKTREE ==="
git -C "$APP_DIR" status --short
git -C "$APP_DIR" stash push --include-untracked -m "operator-preserved-app-$STAMP"
git -C "$APP_DIR" stash list -n 3
test -z "$(git -C "$APP_DIR" status --porcelain)"

echo "=== SAVE DEPLOY WORKTREE ==="
git -C "$DEPLOY_DIR" status --short
git -C "$DEPLOY_DIR" stash push --include-untracked -m "operator-preserved-deploy-$STAMP"
git -C "$DEPLOY_DIR" stash list -n 3
test -z "$(git -C "$DEPLOY_DIR" status --porcelain)"

echo "=== CHECKOUT APPLICATION RELEASE BRANCH ==="
git -C "$APP_DIR" fetch origin --prune
if git -C "$APP_DIR" show-ref --verify --quiet "refs/heads/$SOURCE_BRANCH"; then
  git -C "$APP_DIR" switch "$SOURCE_BRANCH"
else
  git -C "$APP_DIR" switch -c "$SOURCE_BRANCH" --track "origin/$SOURCE_BRANCH"
fi
git -C "$APP_DIR" pull --ff-only

echo "=== VERIFY DEPLOYMENT BRANCH ==="
git -C "$DEPLOY_DIR" fetch origin --prune
git -C "$DEPLOY_DIR" switch "$DEPLOY_BRANCH"
git -C "$DEPLOY_DIR" pull --ff-only

echo "=== FINAL PRECHECK ==="
git -C "$APP_DIR" status --short
git -C "$APP_DIR" branch --show-current
git -C "$APP_DIR" rev-parse HEAD
git -C "$DEPLOY_DIR" status --short
git -C "$DEPLOY_DIR" branch --show-current
docker version >/dev/null

echo "DIRTY_CHECKOUT_UNBLOCK_DONE"
```

## Критерии успеха
- В обоих репозиториях создан именованный stash с timestamp.
- Оба `status --short` в финальном precheck пустые.
- Application branch: `codex/stabilize-stage1-runtime`.
- Deployment branch: `ai/deploy-image-only`.
- Docker доступен пользователю `aidev`.
- Последняя строка: `DIRTY_CHECKOUT_UNBLOCK_DONE`.

## После успеха
Не применять и не удалять stash. Продолжить `docs/TESLYA_TASK_IMMUTABLE_RUNTIME_RELEASE_2026-10-11.md` с нового pre-check. В QA-отчёте записать имена stash, но не содержимое `.env.sandbox` и секретов.
