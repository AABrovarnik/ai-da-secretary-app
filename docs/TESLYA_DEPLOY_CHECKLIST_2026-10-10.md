# Тесля: Deploy Checklist (AI-да-Секретарь, sandbox)

Источник истины (source-of-truth):
- Repo: `git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git`
- Branch: `main`
- Только этот репозиторий авторитетен для `docker-compose` / `Dockerfile` / `nginx` / `deploy`.

## 0) Переменные
```bash
export APP_ROOT="/srv/ai-shared/web-sandbox/ai-da-secretary"
export REPO_SSH="git@github.com:AABrovarnik/ai-da-secretary-sandbox-deploy.git"
export BRANCH="main"
export DOMAIN="sandbox.xn--01-dlcyz9d7b.xn--p1ai"
export FRONT_PORT="18080"
export BACK_PORT="18081"
```

## 1) Подготовка каталога и клон
```bash
mkdir -p /srv/ai-shared/web-sandbox
cd /srv/ai-shared/web-sandbox

if [ ! -d "$APP_ROOT/.git" ]; then
  git clone "$REPO_SSH" "$APP_ROOT"
fi

cd "$APP_ROOT"
git fetch origin
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
```

## 2) Подготовка env
```bash
cp -n deploy/.env.sandbox.example deploy/.env.sandbox
```

Отредактировать `deploy/.env.sandbox` и заполнить минимум:
- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `OPENAI_API_KEY`

Проверка:
```bash
test -f deploy/.env.sandbox && echo "env OK"
```

## 3) Сборка и запуск compose
```bash
cd "$APP_ROOT/deploy"
docker compose --env-file .env.sandbox -f docker-compose.sandbox.yml up -d --build
docker compose --env-file .env.sandbox -f docker-compose.sandbox.yml ps
```

## 4) Локальные проверки контейнеров (на сервере)
```bash
curl -fsS "http://127.0.0.1:${FRONT_PORT}/" >/dev/null && echo "frontend localhost OK"
curl -fsS "http://127.0.0.1:${BACK_PORT}/health" && echo
```

## 5) Nginx vhost (отдельный, academy vhost не трогать)
Создать файл:
`/etc/nginx/sites-available/sandbox-ai-da-secretary.conf`

Содержимое:
```nginx
server {
  listen 80;
  server_name sandbox.xn--01-dlcyz9d7b.xn--p1ai;

  location / {
    proxy_pass http://127.0.0.1:18080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Активировать и перезагрузить:
```bash
ln -sf /etc/nginx/sites-available/sandbox-ai-da-secretary.conf /etc/nginx/sites-enabled/sandbox-ai-da-secretary.conf
nginx -t
systemctl reload nginx
```

## 6) TLS для sandbox-домена
```bash
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN" --redirect
```

Проверка сертификата:
```bash
openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
```

## 7) Внешние проверки
```bash
curl -I "https://${DOMAIN}/"
curl -s "https://${DOMAIN}/api/meetings" -o /dev/null -w "%{http_code}\n"
```

Ожидаемо:
- `/` -> `200`
- `/api/meetings` без токена -> `401`

## 8) Smoke-тест приложения (.ogg)
Если есть PowerShell-раннер:
```powershell
pwsh -File .\scripts\smoke-audio.ps1 -ApiBase "https://sandbox.xn--01-dlcyz9d7b.xn--p1ai" -AudioPath "C:\Users\aabro\Downloads\audio_2026-10-06_16-15-16.ogg"
```

Если на Linux-сервере без PowerShell — ручной smoke через UI/API:
- register/login
- create meeting
- upload `.ogg`
- start `process-latest-audio`
- дождаться `ProcessingRun.status = succeeded`

## 9) Отчёт (обязательный формат)
1. `PLAN FACT`
2. `CHANGED FILES` (точные пути)
3. `COMMAND LOG` (+ exit codes)
4. `CHECKS` (localhost + domain + TLS + smoke)
5. `RISKS/BLOCKERS`
6. `READY/NOT READY`