# OPERATOR_REQUEST_RUNTIME_SSH_INPUTS_2026-10-10.md

## Цель
Снять P0 для runtime acceptance в sandbox.

## Передать агенту Тесля (без секретов)
1. Фактический SSH username для хоста `147.45.238.131`.
2. Подтверждённый ED25519 fingerprint в формате: `SHA256:...`.
3. Подтверждение, что trusted Control UI link доступен
   **или** что настроен `gateway.publicOrigin` для доставки secure credential prompt.

## Важно
- Пароли и приватные ключи в чат не отправлять.
- Приватный ключ/пароль передавать только через approved secure channel.

## Критерий READY для продолжения
- Тесля получает реальные `username + fingerprint` (не шаблоны).
- Secure credential prompt перестаёт падать по ошибке Control UI.

## После READY
Тесля выполняет:
1) SSH unblock check,
2) runtime precheck,
3) runtime acceptance commands-only,
и возвращает итоговый QA с `READY YES/NO`.
