# TESLYA_TZ_UNBLOCK_SSH_SECURE_CHANNEL_2026-10-10.md

## Статус
Текущий P0 подтверждён: подключение к runtime host невозможно без:
1) фактического SSH username,
2) полного ED25519 host-key fingerprint,
3) рабочего trusted Control UI link (или настроенного `gateway.publicOrigin`) для secure credential request.

## Задача
Выполнить только SSH-access unblock. Runtime acceptance пока не запускать.

## Что нужно от оператора
1. Передать фактический `SSH_USERNAME`.
2. Передать полный fingerprint в формате `SHA256:... (ED25519)`.
3. Включить/проверить trusted Control UI link для этого execution context
   (или настроить `gateway.publicOrigin`, чтобы secure credential request доставлялся).

## Проверка после получения данных (команды 1-в-1)
```bash
set -euo pipefail

HOST="147.45.238.131"
USER="<SSH_USERNAME>"
EXPECTED_FP="<SHA256_ED25519_FINGERPRINT>"

# Получить и сверить fingerprint
ssh-keyscan -t ed25519 "$HOST" 2>/dev/null > /tmp/host_ed25519.pub
ACTUAL_FP=$(ssh-keygen -lf /tmp/host_ed25519.pub -E sha256 | awk '{print $2}')

echo "EXPECTED=$EXPECTED_FP"
echo "ACTUAL=$ACTUAL_FP"

test "$ACTUAL_FP" = "$EXPECTED_FP"

# Проверка SSH рукопожатия (без передачи секрета в чат)
ssh -o IdentitiesOnly=yes "$USER@$HOST" 'echo SSH_OK && hostname && whoami'
```

## Критерий DONE
- Fingerprint совпал.
- SSH handshake успешен.
- Secure credential channel рабочий (credential request больше не падает по Control UI).

## Отчёт
Сформировать `QA_REPORT_RUNTIME_SSH_ACCESS_2026-10-10.md`:
1. Preconditions
2. Inputs Received (username/fingerprint/control-ui status)
3. Commands Executed
4. Exit Codes
5. DONE Verdict (YES/NO)
6. Next Required Action (один P0, если остался)

Если DONE=YES, следующий шаг: precheck + runtime acceptance по ранее выданному commands-only.
