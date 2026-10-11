# TESLYA_RUNTIME_ACCEPTANCE_COMMANDS_ONLY_2026-10-10.md

> Scope: image-only runtime acceptance after secrets are prepared.
> Do not print secret values. Do not touch academy production route.

```bash
set -euo pipefail

REPO_DIR="/srv/ai-shared/web-sandbox/ai-da-secretary"
cd "$REPO_DIR"

git fetch --all --prune
git checkout ai/deploy-image-only
git pull --ff-only

test -f deploy/.env.sandbox

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml config > /tmp/compose.rendered.yml

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml pull

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml up -d --no-build --pull always

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml ps

docker compose --env-file deploy/.env.sandbox -f deploy/docker-compose.sandbox.yml logs --tail=120

BACKEND_PORT=$(grep '^BACKEND_PORT=' deploy/.env.sandbox | cut -d= -f2)
FRONTEND_PORT=$(grep '^FRONTEND_PORT=' deploy/.env.sandbox | cut -d= -f2)

curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health"
curl -I -fsS "http://127.0.0.1:${FRONTEND_PORT}/"

openssl s_client -connect 127.0.0.1:443 -servername sandbox.xn--01-dlcyz9d7b.xn--p1ai </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
```

## Report output required
Create/update file: `QA_REPORT_RUNTIME_ACCEPTANCE_2026-10-10.md`
Include:
1) Preconditions
2) Commands Executed
3) Exit Codes
4) Observed Results
5) Risks/Blockers
6) READY Verdict (YES/NO)
7) Next Required Action (single P0 if NOT READY)
