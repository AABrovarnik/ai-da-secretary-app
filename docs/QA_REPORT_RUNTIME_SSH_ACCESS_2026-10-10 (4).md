# QA_REPORT_RUNTIME_SSH_ACCESS_2026-10-10

## 1. Preconditions

- Scope: SSH-access unblock only. Runtime precheck and full runtime acceptance were not run.
- Host supplied: `147.45.238.131`.
- No SSH private key/password was sent in chat.

## 2. Inputs Received

- SSH username: still the placeholder `<SSH_USER>` / `<SSH_USERNAME>`; no usable username received.
- Expected ED25519 fingerprint: still the placeholder `<ED25519_FINGERPRINT>` / `<SHA256_ED25519_FINGERPRINT>`; no trusted expected fingerprint received.
- Trusted Control UI: unavailable to this Gateway execution context. The protected Secret Store was empty.
- Candidate fingerprint observed from `ssh-keyscan`: `SHA256:2CVXeV2/AbKQ6t+YPRMOkn2PI2UjztmFn8j9Wq/WH6c`. This is unverified network output, not a trusted value.

## 3. Commands Executed

- `ssh-keyscan -t ed25519 147.45.238.131` and local fingerprint extraction with `ssh-keygen -lf ... -E sha256`.
- Compared the observed fingerprint to the supplied expected value; comparison could not pass because the expected value is a placeholder.
- Requested `SANDBOX_RUNTIME_SSH_KEY` twice through the protected masked secret channel. Both attempts failed before credential entry because Gateway reported no reachable trusted Control UI link.
- SSH handshake was not attempted because username and expected fingerprint are not usable/trusted.
- No runtime acceptance commands were run.

## 4. Exit Codes / Results

| Check | Result |
|---|---|
| `ssh-keyscan -t ed25519 147.45.238.131` | exit 0; key material retrieved |
| `ssh-keygen` fingerprint extraction | succeeded; candidate fingerprint recorded above |
| Candidate vs expected fingerprint comparison | exit 1; expected fingerprint is a placeholder |
| Protected secret request (attempt 1) | failed: no reachable trusted Control UI link |
| Protected secret request (attempt 2) | failed: no reachable trusted Control UI link |
| SSH handshake | not run |

## 5. DONE Verdict

**DONE: NO.** Fingerprint trust, SSH authentication, and secure credential delivery are not established.

## 6. Next Required Action

**P0 — trusted SSH identity inputs and secure credential entry remain unavailable.** Provide the real SSH username and independently verified ED25519 fingerprint, and enable a trusted Control UI link (or configure `gateway.publicOrigin`) so the private key can be entered through the masked secret prompt. Then repeat fingerprint verification and SSH handshake. Do not send passwords or private keys in chat.

## Latest Operator Request

Sent to the operator via Telegram (message ID `1144`):

> Для снятия P0 по runtime acceptance прошу передать:
> 1) фактический SSH username для хоста 147.45.238.131 (не placeholder);
> 2) подтверждённый ED25519 fingerprint формата SHA256:... (не placeholder);
> 3) подтвердить, что trusted Control UI link доступен, либо что настроен gateway.publicOrigin для masked secure credential prompt.
>
> Пароль и приватный ключ в чат не отправляйте; их можно передать только через approved secure channel. После получения этих входов выполню SSH unblock → runtime precheck → ранее согласованный image-only acceptance.
