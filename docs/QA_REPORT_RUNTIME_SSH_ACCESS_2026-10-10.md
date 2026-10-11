# QA_REPORT_RUNTIME_SSH_ACCESS_2026-10-10

## Status

SSH access acquisition is blocked; no runtime precheck or acceptance commands were run.

## Observed

- Runtime host provided: `147.45.238.131`.
- SSH username and ED25519 fingerprint were provided only as placeholders: `<SSH_USER>` and `<ED25519_FINGERPRINT>`.
- OpenClaw paired-node inventory and shared terminal inventory were both empty; no direct runtime host context is attached here.
- Protected Secret Store was empty.
- Requested `SANDBOX_RUNTIME_SSH_KEY` through the masked secret channel. The request was not delivered because Gateway has no reachable trusted Control UI link. No credential was requested or transmitted through chat.
- The operator was asked in Telegram for the actual SSH username and full ED25519 host-key fingerprint. No response was available at the time of this report.

## Verdict

**READY: NO.** Authentication and host-key verification cannot be completed safely with placeholders and an unavailable secure credential prompt.

## Single P0 / Next Action

**P0 — no usable SSH authentication and host-key verification inputs are available in this execution context.** Enable a trusted Control UI link (or configure `gateway.publicOrigin`) so the operator can supply the SSH private key through the masked credential prompt, and provide the actual SSH username and ED25519 fingerprint. Then run the authorized precheck followed by the already-scoped image-only runtime acceptance. Do not send passwords or private keys in chat.
