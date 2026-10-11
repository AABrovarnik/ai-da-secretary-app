# Unblock Тесли: корректное владение runtime checkout

## Кто выполняет
Следующий блок выполняет оператор под `root` на сервере `147.45.238.131`. Команды не изменяют содержимое репозиториев, контейнеры, volumes, Nginx или Academy.

## Root-команды
Скопировать и выполнить блок целиком:

```bash
set -euo pipefail

APP_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary-app-src"
DEPLOY_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
TARGET_USER="aidev"
TARGET_GROUP="aidev"

id "$TARGET_USER"

test "$(realpath -e "$APP_DIR")" = "$APP_DIR"
test "$(realpath -e "$DEPLOY_DIR")" = "$DEPLOY_DIR"
test -d "$APP_DIR/.git"
test -d "$DEPLOY_DIR/.git"

echo "=== BEFORE ==="
stat -c '%U:%G %a %n' "$APP_DIR" "$APP_DIR/.git" "$DEPLOY_DIR" "$DEPLOY_DIR/.git"

chown -R "$TARGET_USER:$TARGET_GROUP" "$APP_DIR" "$DEPLOY_DIR"

if [ -f "$DEPLOY_DIR/deploy/.env.sandbox" ]; then
  chown "$TARGET_USER:$TARGET_GROUP" "$DEPLOY_DIR/deploy/.env.sandbox"
  chmod 600 "$DEPLOY_DIR/deploy/.env.sandbox"
fi

echo "=== AFTER ==="
stat -c '%U:%G %a %n' "$APP_DIR" "$APP_DIR/.git" "$DEPLOY_DIR" "$DEPLOY_DIR/.git"

echo "=== GIT AS AIDEV ==="
runuser -u "$TARGET_USER" -- git -C "$APP_DIR" status --short
runuser -u "$TARGET_USER" -- git -C "$APP_DIR" branch --show-current
runuser -u "$TARGET_USER" -- git -C "$DEPLOY_DIR" status --short
runuser -u "$TARGET_USER" -- git -C "$DEPLOY_DIR" branch --show-current

echo "OWNERSHIP_UNBLOCK_DONE"
```

## Ожидаемый результат
- Четыре строки `stat` в секции `AFTER` начинаются с `aidev:aidev`.
- Git больше не сообщает `dubious ownership`.
- Команда завершается строкой `OWNERSHIP_UNBLOCK_DONE`.
- Если `git status --short` показывает изменения, их не удалять и не выполнять `reset`; передать вывод Тесле.

## Не делать
- Не добавлять пути в глобальный `safe.directory`.
- Не выполнять `chmod -R 777`.
- Не выполнять `git reset --hard`, `git clean`, удаление volumes или restart host.
- Не менять `/etc/nginx`, сертификаты и Academy.

## Следующее действие Тесли
После `OWNERSHIP_UNBLOCK_DONE` повторить pre-check из `docs/TESLYA_TASK_IMMUTABLE_RUNTIME_RELEASE_2026-10-11.md`. Если оба checkout чистые, открыть PR без merge и выполнить immutable GHCR release/acceptance. Если checkout dirty, остановиться с одним P0 и показать только список файлов без содержимого секретов.
