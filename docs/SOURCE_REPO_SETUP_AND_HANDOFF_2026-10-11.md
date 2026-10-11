# SOURCE_REPO_SETUP_AND_HANDOFF_2026-10-11.md

## Почему это нужно
Сейчас runtime deploy-репозиторий содержит только deployment-файлы.
Для публикации GHCR-образов Тесле нужен отдельный репозиторий с исходниками приложения (`apps/`, `prisma/`, `docker/`).

## Важно (проверено)
Текущая папка `C:\Users\aabro\Documents\Codex\Напоминалка` не является корнем отдельного git-репозитория (корень выше: `C:\Users\aabro`).
Поэтому нужно создать отдельный repo именно для этой папки.

## Шаг 1. Создай пустой GitHub-репозиторий
На GitHub создай новый пустой репозиторий, например:
- `ai-da-secretary-app`

Без README/.gitignore/license (пустой).

## Шаг 2. Инициализируй git именно в папке приложения
PowerShell (локально):

```powershell
cd "C:\Users\aabro\Documents\Codex\Напоминалка"

git init
git checkout -b main

git add .
git commit -m "feat: stage1 app source for GHCR build"

git remote add origin git@github.com:AABrovarnik/ai-da-secretary-app.git
$env:GIT_SSH_COMMAND = "ssh -i $env:USERPROFILE\.ssh\id_ed25519 -o IdentitiesOnly=yes"
git push -u origin main
```

Если `git remote add origin` ругнётся что origin уже есть:

```powershell
git remote set-url origin git@github.com:AABrovarnik/ai-da-secretary-app.git
git push -u origin main
```

## Шаг 3. Проверка
Убедись, что на GitHub в новом repo видны:
- `apps/`
- `prisma/`
- `docker/`
- `package.json`

## Шаг 4. Что отправить Тесле (1-в-1)

```text
SOURCE_REPO_URL=https://github.com/AABrovarnik/ai-da-secretary-app.git
SOURCE_BRANCH=main
APP_PATH=.
```

И допиши:

```text
Используй этот repo как source для build/push GHCR images (frontend/backend), затем верни точные BACKEND_IMAGE/BACKEND_TAG/FRONTEND_IMAGE/FRONTEND_TAG для deploy/.env.sandbox.
```

## Примечание
После публикации образов Теслей мы продолжаем runtime acceptance на сервере из deploy-репозитория.
